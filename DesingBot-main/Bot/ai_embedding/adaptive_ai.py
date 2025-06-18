from typing import Dict, List, Optional, Any
import json
import time
from ai_embedding.ai import answer_general_question, generate_answer, embed_question
from core.state_manager import StateManager
from core.search_service import AdvancedSearchService

class AdaptiveAIService:
    def __init__(self, state_manager: StateManager, search_service: AdvancedSearchService):
        self.state_manager = state_manager
        self.search_service = search_service
        
        # Plantillas de prompts adaptativas por nivel
        self.prompt_templates = {
            "beginner": {
                "design": "Como mentor de diseño UX/UI para principiantes, explica de manera simple y didáctica: {question}. Incluye definiciones básicas, ejemplos visuales y pasos prácticos. Evita tecnicismos complejos.",
                "ux": "Explica a un principiante en UX: {question}. Usa ejemplos cotidianos, define términos técnicos y proporciona pasos concretos para empezar.",
                "ui": "Para alguien nuevo en UI design, explica: {question}. Incluye principios básicos, ejemplos de apps conocidas y consejos prácticos para empezar.",
                "tools": "Como guía para principiantes en {tool}, explica: {question}. Incluye pasos básicos, ubicación de herramientas y tips para empezar."
            },
            "intermediate": {
                "design": "Como diseñador UX/UI con experiencia intermedia, analiza: {question}. Incluye mejores prácticas, casos de uso reales y consideraciones avanzadas.",
                "ux": "Para un UXer con experiencia intermedia, profundiza en: {question}. Incluye metodologías específicas, métricas y casos de estudio relevantes.",
                "ui": "Como diseñador UI intermedio, analiza: {question}. Incluye patrones avanzados, sistemas de diseño y tendencias actuales.",
                "tools": "Para usuario intermedio de {tool}, explica técnicas avanzadas de: {question}. Incluye workflows eficientes y funciones pro."
            },
            "expert": {
                "design": "Como líder de diseño senior, analiza estratégicamente: {question}. Incluye implicaciones de negocio, escalabilidad y liderazgo de equipos.",
                "ux": "Desde perspectiva senior en UX, evalúa: {question}. Incluye impacto organizacional, investigación avanzada y métricas de negocio.",
                "ui": "Como Design System Lead, analiza: {question}. Incluye arquitectura de componentes, tokens de diseño y gobernanza.",
                "tools": "Para experto en {tool}, explica optimizaciones avanzadas de: {question}. Incluye automatización, plugins personalizados y workflows empresariales."
            }
        }
        
        # Estilos de respuesta personalizables
        self.response_styles = {
            "professional": "Responde de manera profesional y técnica, usando terminología de la industria.",
            "casual": "Responde de manera amigable y conversacional, como un colega experimentado.",
            "academic": "Responde con rigor académico, incluyendo referencias teóricas y estudios.",
            "practical": "Enfócate en ejemplos prácticos y aplicaciones del mundo real."
        }
    
    def generate_adaptive_response(self, question: str, command_type: str, user_id: int, context_chunks=None) -> str:
        """Genera respuesta adaptada al perfil del usuario"""
        session = self.state_manager.get_user_session(user_id)
        
        # Obtener nivel y preferencias del usuario
        expertise_level = session.expertise_level
        response_style = session.preferences.get("response_style", "professional")
        favorite_tools = session.favorite_tools
        interests = session.preferences.get("interests", [])
        
        # Construir prompt contextualizado
        base_prompt = self._build_contextual_prompt(
            question, command_type, expertise_level, favorite_tools, interests
        )
        
        # Añadir estilo de respuesta
        style_instruction = self.response_styles.get(response_style, self.response_styles["professional"])
        full_prompt = f"{base_prompt}\n\nEstilo de respuesta: {style_instruction}"
        
        # Añadir contexto de historial si es relevante
        conversation_context = self._get_conversation_context(user_id)
        if conversation_context:
            full_prompt += f"\n\nContexto de conversación previa: {conversation_context}"
        
        # Generar respuesta según tipo
        if context_chunks:
            # Respuesta basada en documentos
            return self._generate_document_based_response(full_prompt, context_chunks, session)
        else:
            # Respuesta general de IA
            return self._generate_general_response(full_prompt, session)
    
    def _build_contextual_prompt(self, question: str, command_type: str, level: str, tools: List[str], interests: List[str]) -> str:
        """Construye prompt adaptado al contexto del usuario"""
        
        # Obtener template base según nivel
        template = self.prompt_templates.get(level, self.prompt_templates["intermediate"])
        command_template = template.get(command_type, template["design"])
        
        # Detectar herramienta específica en la pregunta
        detected_tool = self._detect_tool_in_question(question, tools)
        
        # Formatear prompt con contexto
        if detected_tool and "{tool}" in command_template:
            base_prompt = command_template.format(question=question, tool=detected_tool)
        else:
            base_prompt = command_template.format(question=question)
        
        # Añadir contexto de intereses
        if interests:
            interest_context = f"\n\nConsiderando tu interés en: {', '.join(interests)}, "
            if "UX Research" in interests and command_type in ["ux", "design"]:
                interest_context += "incluye metodologías de investigación relevantes."
            elif "Design Systems" in interests and command_type in ["ui", "design"]:
                interest_context += "incluye consideraciones de sistemas de diseño."
            elif "Prototyping" in interests:
                interest_context += "incluye aspectos de prototipado e interacción."
            
            base_prompt += interest_context
        
        # Añadir contexto de herramientas favoritas
        if tools and not detected_tool:
            tools_context = f"\n\nCuando sea relevante, considera herramientas como: {', '.join(tools[:3])}."
            base_prompt += tools_context
        
        return base_prompt
    
    def _detect_tool_in_question(self, question: str, user_tools: List[str]) -> Optional[str]:
        """Detecta si hay una herramienta específica mencionada en la pregunta"""
        question_lower = question.lower()
        
        # Herramientas y sus variaciones
        tool_variations = {
            "Figma": ["figma", "fig"],
            "Sketch": ["sketch"],
            "Adobe XD": ["xd", "adobe xd", "experience design"],
            "InVision": ["invision", "in vision"],
            "Framer": ["framer"],
            "Principle": ["principle"],
            "Protopie": ["protopie", "proto pie"],
            "Axure": ["axure"],
            "Marvel": ["marvel"],
            "Zeplin": ["zeplin"]
        }
        
        # Buscar primero en herramientas favoritas del usuario
        for tool in user_tools:
            if tool in tool_variations:
                for variation in tool_variations[tool]:
                    if variation in question_lower:
                        return tool
        
        # Buscar en todas las herramientas
        for tool, variations in tool_variations.items():
            for variation in variations:
                if variation in question_lower:
                    return tool
        
        return None
    
    def _get_conversation_context(self, user_id: int) -> str:
        """Obtiene contexto de conversación reciente"""
        session = self.state_manager.get_user_session(user_id)
        recent_history = session.conversation_history[-3:]  # Últimos 3 mensajes
        
        if not recent_history:
            return ""
        
        context_parts = []
        for entry in recent_history:
            if isinstance(entry, dict):
                message = entry.get("message", "")
                context = entry.get("context", "")
                if message and len(message) > 10:
                    context_parts.append(f"- {context}: {message}")
        
        return " ".join(context_parts) if context_parts else ""
    
    def _generate_document_based_response(self, prompt: str, context_chunks: List, session) -> str:
        """Genera respuesta basada en documentos con prompt adaptativo"""
        try:
            # Personalizar prompt para búsqueda con documentos
            doc_prompt = (
                f"{prompt}\n\n"
                f"IMPORTANTE: Adapta tu respuesta al nivel '{session.expertise_level}' del usuario. "
                f"Herramientas favoritas: {', '.join(session.favorite_tools) if session.favorite_tools else 'No especificadas'}.\n"
                f"Intereses: {', '.join(session.preferences.get('interests', [])) if session.preferences.get('interests') else 'Generales'}.\n\n"
                "Basándote en los documentos proporcionados, da una respuesta completa y personalizada."
            )
            
            # Usar el sistema de generación existente pero con prompt mejorado
            answer, references = generate_answer(prompt, context_chunks, context_chunks)
            
            # Post-procesar respuesta para añadir personalización adicional
            personalized_answer = self._post_process_response(answer, session)
            
            return personalized_answer
            
        except Exception as e:
            return f"Error generando respuesta personalizada: {str(e)}"
    
    def _generate_general_response(self, prompt: str, session) -> str:
        """Genera respuesta general con IA adaptativa"""
        try:
            # Añadir contexto de personalización al prompt
            personalized_prompt = (
                f"{prompt}\n\n"
                f"Contexto del usuario:\n"
                f"- Nivel de experiencia: {session.expertise_level}\n"
                f"- Herramientas favoritas: {', '.join(session.favorite_tools) if session.favorite_tools else 'No especificadas'}\n"
                f"- Áreas de interés: {', '.join(session.preferences.get('interests', [])) if session.preferences.get('interests') else 'Generales'}\n"
                f"- Búsquedas realizadas: {session.search_count}\n\n"
                "Personaliza tu respuesta según este perfil del usuario."
            )
            
            response = answer_general_question(personalized_prompt)
            return self._post_process_response(response, session)
            
        except Exception as e:
            return f"Error generando respuesta: {str(e)}"
    
    def _post_process_response(self, response: str, session) -> str:
        """Post-procesa la respuesta para añadir elementos personalizados"""
        
        # Añadir recomendaciones personalizadas al final
        personalized_additions = []
        
        # Sugerencias basadas en herramientas favoritas
        if session.favorite_tools:
            tool_tips = {
                "Figma": "💡 **Tip de Figma:** Usa Auto Layout para componentes responsive",
                "Sketch": "💡 **Tip de Sketch:** Organiza con Symbols y Libraries compartidas",
                "Adobe XD": "💡 **Tip de Adobe XD:** Aprovecha Voice Prototyping para UX conversacional"
            }
            
            for tool in session.favorite_tools[:2]:  # Max 2 tips
                if tool in tool_tips:
                    personalized_additions.append(tool_tips[tool])
        
        # Sugerencias basadas en nivel de experiencia
        level_tips = {
            "beginner": "🌱 **Siguiente paso:** Practica con proyectos pequeños y busca feedback constante",
            "intermediate": "🚀 **Recomendación:** Considera crear un design system personal para consolidar conocimientos",
            "expert": "⭐ **Desafío:** Mentoriza a otros diseñadores y contribuye a la comunidad"
        }
        
        level_tip = level_tips.get(session.expertise_level)
        if level_tip:
            personalized_additions.append(level_tip)
        
        # Sugerencias de búsquedas relacionadas
        suggestions = self.search_service.get_search_suggestions(session.user_id)
        if suggestions:
            search_tip = f"🔍 **Búsquedas sugeridas:** {', '.join(suggestions[:3])}"
            personalized_additions.append(search_tip)
        
        # Combinar respuesta con adiciones personalizadas
        if personalized_additions:
            response += "\n\n" + "\n\n".join(personalized_additions)
        
        return response
    
    def get_response_preview(self, question: str, command_type: str, user_id: int) -> Dict[str, str]:
        """Genera vista previa de cómo se adaptaría la respuesta por nivel"""
        session = self.state_manager.get_user_session(user_id)
        
        previews = {}
        for level in ["beginner", "intermediate", "expert"]:
            # Crear sesión temporal con nivel diferente
            temp_session = session
            temp_session.expertise_level = level
            
            prompt = self._build_contextual_prompt(
                question, command_type, level, 
                session.favorite_tools, session.preferences.get("interests", [])
            )
            
            # Generar vista previa corta (solo primeras líneas del prompt)
            preview = prompt.split('\n')[0][:100] + "..."
            previews[level] = preview
        
        return previews