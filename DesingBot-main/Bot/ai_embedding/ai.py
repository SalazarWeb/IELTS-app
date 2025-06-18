import time
import os
from typing import List, Dict, Any
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from logger import ai_logger
import numpy as np
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
import queue

url = "https://api.fireworks.ai/inference/v1/embeddings"
url_llm = "https://api.fireworks.ai/inference/v1/chat/completions"

# API Key desde variable de entorno
api_key = os.getenv('FIRE', 'fw_3ZbneyZaTFytBHirqLphxtPi')
headers = {
    "Authorization": f'Bearer {api_key}',
    "Content-Type": "application/json",
}

# Lock para thread safety
_session_lock = threading.Lock()
_session = None

def get_http_session():
    """Crea y retorna una sesión HTTP con pooling de conexiones y retry automático"""
    global _session
    
    with _session_lock:
        if _session is None:
            _session = requests.Session()
            
            # Configurar strategy de retry
            retry_strategy = Retry(
                total=3,
                backoff_factor=1,
                status_forcelist=[429, 500, 502, 503, 504],
                respect_retry_after_header=True
            )
            
            # Configurar adapter con pooling
            adapter = HTTPAdapter(
                max_retries=retry_strategy,
                pool_connections=10,
                pool_maxsize=20,
                pool_block=False
            )
            
            _session.mount("http://", adapter)
            _session.mount("https://", adapter)
            
            # Headers por defecto
            _session.headers.update(headers)
            
            ai_logger.info("Sesión HTTP configurada con pooling y retry automático")
        
        return _session

def make_api_request(url: str, payload: dict, timeout: int = 30):
    """Hace un request HTTP robusto con manejo de errores"""
    session = get_http_session()
    
    try:
        response = session.post(url, json=payload, timeout=timeout)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        ai_logger.error(f"Timeout en request a {url}")
        raise Exception("Timeout en la conexión con el servicio de IA")
    except requests.exceptions.ConnectionError:
        ai_logger.error(f"Error de conexión a {url}")
        raise Exception("Error de conexión con el servicio de IA")
    except requests.exceptions.HTTPError as e:
        ai_logger.error(f"Error HTTP {e.response.status_code}: {e.response.text}")
        raise Exception(f"Error del servidor de IA: {e.response.status_code}")
    except Exception as e:
        ai_logger.error(f"Error inesperado en request: {str(e)}")
        raise

def generate_embeddings(chunks: List[Dict[str, Any]]) -> None:
    """
    Genera embeddings para los fragmentos de texto que no los tengan
    Versión mejorada con procesamiento paralelo y manejo robusto de errores

    Args:
        chunks: Lista de fragmentos con metadatos

    Returns:
        None - Modifica los chunks in-place
    """
    ai_logger.info(f"Solicitada generación de embeddings para {len(chunks)} chunks")

    # Contador de embeddings a generar
    chunks_to_process = [chunk for chunk in chunks if "embedding" not in chunk]
    
    if not chunks_to_process:
        ai_logger.info("Todos los chunks ya tienen embeddings. No es necesario generar nuevos.")
        return

    ai_logger.info(f"Se generarán {len(chunks_to_process)} nuevos embeddings")

    # Procesar embeddings en paralelo (máximo 3 threads para no sobrecargar la API)
    start_time = time.time()
    generated_count = 0
    failed_count = 0
    
    def process_chunk(chunk):
        """Procesa un chunk individual"""
        chunk_id = chunk.get("chunk_id", "Unknown")
        try:
            text = chunk.get("text", "")
            if not text:
                ai_logger.warning(f"Fragmento {chunk_id} no tiene texto para embeddings")
                return False
                
            embedding = embed_question(text)
            if embedding:
                chunk["embedding"] = embedding
                ai_logger.debug(f"Embedding generado correctamente para {chunk_id}")
                return True
            else:
                ai_logger.error(f"No se pudo generar embedding para {chunk_id}")
                return False
        except Exception as e:
            ai_logger.error(f"Error procesando chunk {chunk_id}: {str(e)}")
            return False
    
    # Procesamiento paralelo con ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=3) as executor:
        future_to_chunk = {executor.submit(process_chunk, chunk): chunk for chunk in chunks_to_process}
        
        for future in as_completed(future_to_chunk):
            if future.result():
                generated_count += 1
            else:
                failed_count += 1
            
            # Rate limiting - pausa entre requests
            time.sleep(0.1)

    elapsed_time = time.time() - start_time
    avg_time = elapsed_time / len(chunks_to_process) if chunks_to_process else 0

    ai_logger.info(
        f"Generación completada: {generated_count} exitosos, {failed_count} fallidos "
        f"en {elapsed_time:.2f} segundos (promedio: {avg_time:.2f} s/embedding)"
    )

def generate_answer(
    question: str,
    context_chunks: List[Dict[str, Any]] | List[List[int]],
    save_chunks: List[Dict[str, Any]] | List[List[int]],
    model: str = "accounts/fireworks/models/llama-v3p3-70b-instruct",
) -> tuple:
    """
    Genera una respuesta especializada en UX/UI Design citando recursos específicos.
    Versión mejorada con manejo robusto de conexiones.

    Args:
        question: Pregunta del usuario sobre diseño
        context_chunks: Fragmentos de recursos de diseño relevantes
        save_chunks: Todos los chunks disponibles para búsqueda
        model: Modelo generativo a usar

    Returns:
        tuple: (respuesta_formateada, referencias_detalladas)
    """
    try:
        # Procesar los chunks de contexto
        processed_chunks = []
        for chunk in context_chunks:
            if isinstance(chunk, dict):
                processed_chunks.append(chunk)
            else:
                original_chunk = find_original_chunk(chunk, save_chunks)
                if original_chunk:
                    processed_chunks.append(original_chunk)

        if not processed_chunks:
            return (
                "No se encontraron recursos de diseño relevantes para responder a tu pregunta.",
                [],
            )

        context_text = ""
        for chunk in processed_chunks:
            doc_name = (
                os.path.basename(chunk["document"])
                .replace(".pdf", "")
                .replace("_", " ")
            )

            pages = ", ".join(map(str, chunk["pages"])) if "pages" in chunk else "N/A"

            context_text += (
                f"\n\n📚 Recurso: {doc_name}\n"
                f"📖 Páginas: {pages}\n"
                f"📝 Contenido:\n{chunk['text']}\n"
                "――――――――――――――――――――――"
            )

        # Prompt especializado en UX/UI
        prompt = (
            "Eres un experto senior en UX/UI Design con más de 10 años de experiencia. "
            "Respondes con conocimientos profundos sobre investigación de usuarios, "
            "diseño de interfaces, usabilidad, accesibilidad, design systems y mejores prácticas. "
            f"PREGUNTA: {question}\n\n"
            "RECURSOS DE DISEÑO RELEVANTES:\n" + context_text + "\n\n"
            "Basándote en la información anterior y tu experiencia en diseño, "
            "proporciona una respuesta profesional y práctica. "
            "Incluye ejemplos concretos, mejores prácticas y consideraciones importantes. "
            "Estructura tu respuesta con encabezados en Markdown cuando sea apropiado. "
            "Si es relevante, menciona herramientas específicas como Figma, Sketch, Adobe XD, etc.\n\n"
            "RESPUESTA:"
        )

        # Configurar payload para la API
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "Eres un experto UX/UI Designer y consultor de experiencia de usuario. Respondes de manera profesional, práctica y con ejemplos concretos del mundo real del diseño digital.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.3,  # Precisión para consejos de diseño
            "max_tokens": 1500,
            "top_p": 0.9,
        }

        # Generar respuesta con manejo robusto
        ai_logger.info("Generando respuesta de IA...")
        response_data = make_api_request(url_llm, payload, timeout=45)

        # Procesar respuesta
        answer = (
            response_data.get("choices", [{}])[0].get("message", {}).get("content", "")
        )

        if not answer:
            ai_logger.warning("Respuesta vacía de la API")
            return "No se pudo generar una respuesta adecuada. Intenta reformular tu pregunta.", []

        # Extraer referencias únicas
        unique_refs = []
        for chunk in processed_chunks:
            doc_name = (
                os.path.basename(chunk["document"])
                .replace(".pdf", "")
                .replace("_", " ")
            )

            pages = ", ".join(map(str, chunk["pages"])) if "pages" in chunk else "N/A"

            ref_str = f"📄 {doc_name} | | 📌 Pág. {pages}"
            unique_refs.append(ref_str)

        answer += "\n\n💡 **Tip profesional:** Siempre valida tus decisiones de diseño con usuarios reales y datos de usabilidad."

        return answer, unique_refs

    except Exception as e:
        ai_logger.error(f"Error generando respuesta: {str(e)}")
        return (
            f"⚠️ Error al generar respuesta para tu consulta de diseño: {str(e)}",
            [],
        )


def find_original_chunk(vector, chunks_db):
    """
    Función para encontrar el chunk original correspondiente a un vector.
    se Podrá optimizar? par que no sea O(n)?
    """

    closest_chunk = None
    min_distance = float("inf")

    for chunk in chunks_db:
        chunk_vector = chunk.get("embedding")
        if chunk_vector:
            distance = np.linalg.norm(np.array(vector) - np.array(chunk_vector))
            if distance < min_distance:
                min_distance = distance
                closest_chunk = chunk

    return closest_chunk


def embed_question(question: str) -> List[float]:
    """
    Genera embedding para una pregunta
    Versión mejorada con manejo robusto de conexiones

    Args:
        question: Pregunta a convertir en embedding

    Returns:
        List[float]: Embedding generado
    """
    try:
        payload = {
            "input": question,
            "model": "nomic-ai/nomic-embed-text-v1.5",
            "dimensions": 768,
        }
        
        ai_logger.debug(f"Generando embedding para texto de {len(question)} caracteres")
        response_data = make_api_request(url, payload, timeout=30)
        
        question_embedding = response_data["data"][0]["embedding"]
        ai_logger.debug("Embedding generado exitosamente")
        return question_embedding
        
    except Exception as e:
        ai_logger.error(f"Error generando embedding: {str(e)}")
        return None

def answer_general_question(pregunta: str) -> str:
    """
    Genera una respuesta especializada en UX/UI Design para preguntas generales.
    Versión mejorada con manejo robusto de conexiones.

    Args:
        pregunta: La pregunta del usuario sobre diseño

    Returns:
        str: Respuesta especializada en UX/UI Design
    """
    try:
        prompt = (
            "Como experto senior en UX/UI Design, responde de manera detallada y práctica:\n"
            f"Pregunta: {pregunta}\n\n"
            "Incluye cuando sea relevante:\n"
            "- Principios de diseño fundamentales\n"
            "- Mejores prácticas de UX/UI\n"
            "- Herramientas recomendadas (Figma, Sketch, Adobe XD, etc.)\n"
            "- Ejemplos de aplicación real\n"
            "- Consideraciones de usabilidad y accesibilidad\n"
            "- Tendencias actuales del diseño\n"
            "Respuesta profesional (formato markdown):"
        )

        payload = {
            "model": "accounts/fireworks/models/llama-v3p3-70b-instruct",
            "messages": [
                {
                    "role": "system",
                    "content": "Eres un diseñador UX/UI experto y mentor. Respondes con conocimiento profundo sobre experiencia de usuario, interfaces, usabilidad, accesibilidad y herramientas de diseño modernas.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.3,
            "max_tokens": 1500,
            "top_p": 0.9,
        }

        ai_logger.info("Generando respuesta general de diseño...")
        response_data = make_api_request(url_llm, payload, timeout=45)

        answer = (
            response_data.get("choices", [{}])[0].get("message", {}).get("content", "")
        )
        
        if not answer:
            ai_logger.warning("Respuesta vacía de la API")
            return "No se pudo generar una respuesta. Por favor, intenta reformular tu pregunta de diseño."
            
        return answer

    except Exception as e:
        error_msg = f"⚠️ Error al generar respuesta para tu consulta de diseño: {str(e)}"
        ai_logger.error(error_msg)
        return error_msg
