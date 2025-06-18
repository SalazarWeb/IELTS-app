import os
import logging
import telebot
import time
from telebot import types
from typing import List, Dict, Any, Set, Optional
from ai_embedding.extract import process_documents, search_similar_chunks_sklearn
from ai_embedding.ai import answer_general_question, embed_question
from constants import DOCUMENTS_FOLDER, DESIGN_CATEGORIES, CATEGORY_EMOJIS, CATEGORY_DESCRIPTIONS
from core.state_manager import StateManager
from core.onboarding import OnboardingSystem
from core.search_service import AdvancedSearchService
from core.admin_service import AdminService
from ai_embedding.adaptive_ai import AdaptiveAIService


def sanitize_markdown(text):
    """Sanitiza el texto para evitar errores de markdown en Telegram"""
    if not text:
        return ""
    
    # Si el texto es muy largo, dividirlo en partes
    if len(text) > 4000:
        parts = []
        current_part = ""
        
        lines = text.split('\n')
        for line in lines:
            if len(current_part + line + '\n') > 4000:
                if current_part:
                    parts.append(current_part.strip())
                current_part = line + '\n'
            else:
                current_part += line + '\n'
        
        if current_part:
            parts.append(current_part.strip())
        
        return parts
    
    return text


class BotHandler:
    def __init__(self, bot=None):
        """
        Inicializa el manejador del DesignBot UX/UI con funcionalidades avanzadas

        Args:
            bot: Instancia de TeleBot pasada desde main.py
        """
        self._init_logging()
        self.bot = bot
        self.processing_users = set()
        
        # Inicializar servicios core
        print("🎨 Inicializando DesignBot con funcionalidades avanzadas...")
        self.state_manager = StateManager()
        self.search_service = AdvancedSearchService(self.state_manager)
        self.onboarding_system = OnboardingSystem(bot, self.state_manager)
        self.admin_service = AdminService(bot, self.state_manager, self.search_service)
        self.adaptive_ai = AdaptiveAIService(self.state_manager, self.search_service)
        
        self._init_data()

    def _init_logging(self):
        """Configura el logger para esta clase"""
        self.logger = logging.getLogger(__name__)

    def _init_data(self):
        """Inicializa el acceso a los datos procesados"""
        try:
            # Procesamiento de PDFs/vectores realizado solo una vez al inicio
            self.index_model, self.chunks = process_documents()
            if not self.index_model or not self.chunks:
                self.logger.warning("No se pudieron cargar índices o documentos")
        except Exception as e:
            self.logger.error(f"Error inicializando datos: {str(e)}")
            self.index_model = None
            self.chunks = []

    def process_all_pdfs(self):
        """Procesa todos los PDFs para crear embeddings e índices"""
        self.index_model, self.chunks = process_documents()
        return bool(self.index_model and self.chunks)

    def start(self, message_or_call):
        """Maneja el comando start con onboarding avanzado"""
        chat_id = (
            message_or_call.chat.id
            if hasattr(message_or_call, "chat")
            else message_or_call.message.chat.id
        )
        user_id = (
            message_or_call.from_user.id
            if hasattr(message_or_call, "from_user")
            else message_or_call.message.from_user.id
        )

        # Actualizar analytics
        self.admin_service.update_analytics('start_command', {'user_id': user_id})
        
        # Iniciar onboarding inteligente
        self.onboarding_system.start_onboarding(message_or_call)

    def handle_general_question(self, message):
        """Maneja preguntas generales con IA adaptativa"""
        start_time = time.perf_counter()
        
        # Determinar el comando y extraer la pregunta
        text = message.text
        question = ""
        command_type = "general"
        
        if text.startswith("/design "):
            question = text.replace("/design ", "")
            command_type = "design"
        elif text.startswith("/ux "):
            question = text.replace("/ux ", "")
            command_type = "ux"
        elif text.startswith("/ui "):
            question = text.replace("/ui ", "")
            command_type = "ui"
        elif text.startswith("/tools "):
            question = text.replace("/tools ", "")
            command_type = "tools"
        elif text.startswith("/ask "):
            question = text.replace("/ask ", "")
            command_type = "general"
        else:
            question = text.replace("/ask", "").strip()
        
        if not question:
            help_messages = {
                "design": "❌ **Formato correcto:** `/design [tu pregunta sobre diseño]`\n\n📝 *Ejemplo:* `/design principios de diseño visual`",
                "ux": "❌ **Formato correcto:** `/ux [tu pregunta sobre UX]`\n\n📝 *Ejemplo:* `/ux cómo hacer user research efectivo`",
                "ui": "❌ **Formato correcto:** `/ui [tu pregunta sobre UI]`\n\n📝 *Ejemplo:* `/ui mejores prácticas para botones`",
                "tools": "❌ **Formato correcto:** `/tools [tu pregunta sobre herramientas]`\n\n📝 *Ejemplo:* `/tools cómo usar componentes en Figma`",
                "general": "❌ **Formato correcto:** `/ask [tu pregunta]`\n\n📝 *Ejemplo:* `/ask diferencia entre UX y UI`"
            }
            
            self.bot.send_message(
                message.chat.id,
                help_messages.get(command_type, help_messages["general"]),
                parse_mode="Markdown",
            )
            return

        user_id = message.from_user.id
        if user_id in self.processing_users:
            self.bot.send_message(
                message.chat.id,
                "⏳ Ya estoy procesando tu consulta anterior. Por favor espera...",
            )
            return

        self.processing_users.add(user_id)
        
        # Actualizar contexto y historial del usuario
        self.state_manager.update_user_context(user_id, f"question_{command_type}")
        self.state_manager.add_to_history(user_id, question)
        
        # Mensaje contextual según el tipo de comando
        context_messages = {
            "design": "🎨 Analizando principios de diseño...",
            "ux": "👥 Consultando mejores prácticas de UX...",
            "ui": "🖼️ Revisando patrones de interfaz...",
            "tools": "🛠️ Buscando guías de herramientas...",
            "general": "💭 Procesando tu consulta de diseño..."
        }
        
        try:
            self.bot.send_chat_action(message.chat.id, "typing")
            status_msg = self.bot.send_message(
                message.chat.id, 
                context_messages.get(command_type, context_messages["general"])
            )

            self.logger.info(f"Generando respuesta adaptativa de {command_type} para usuario {user_id}: {question[:50]}...")
            
            # Usar IA adaptativa para generar respuesta personalizada
            respuesta = self.adaptive_ai.generate_adaptive_response(
                question, command_type, user_id
            )

            # Eliminar mensaje de estado
            try:
                self.bot.delete_message(message.chat.id, status_msg.message_id)
            except:
                pass

            safe_response = sanitize_markdown(respuesta)

            if isinstance(safe_response, list):
                for part in safe_response:
                    self.bot.send_message(message.chat.id, part, parse_mode="Markdown")
            else:
                self.bot.send_message(
                    message.chat.id, safe_response, parse_mode="Markdown"
                )

            # Actualizar analytics con tiempo de respuesta
            response_time = time.perf_counter() - start_time
            self.admin_service.update_analytics('ai_response', {
                'user_id': user_id,
                'command_type': command_type,
                'response_time': response_time,
                'success': True
            })

        except Exception as e:
            self.logger.error(f"Error en handle_general_question para usuario {user_id}: {str(e)}")
            # Eliminar mensaje de estado si existe
            try:
                self.bot.delete_message(message.chat.id, status_msg.message_id)
            except:
                pass
            
            # Mensaje de error más específico
            error_msg = "❌ No pude generar una respuesta en este momento."
            if "timeout" in str(e).lower() or "connection" in str(e).lower():
                error_msg += "\n\n⏱️ El servicio está experimentando alta demanda. Por favor, intenta nuevamente en unos momentos."
            else:
                error_msg += "\n\n💡 Intenta reformular tu pregunta de diseño o usar `/help` para ver otros comandos."
            
            self.bot.send_message(message.chat.id, error_msg)
            
            # Actualizar analytics de error
            self.admin_service.update_analytics('ai_response', {
                'user_id': user_id,
                'command_type': command_type,
                'success': False,
                'error': str(e)
            })
        finally:
            elapsed = time.perf_counter() - start_time
            self.logger.info(
                f"Tiempo de respuesta de handle_general_question para usuario {user_id}: {elapsed:.3f} segundos"
            )
            self.processing_users.discard(user_id)

    def handle_embedding_search(self, message):
        """Busca documentos con búsqueda contextual avanzada"""
        start_time = time.perf_counter()
        question = message.text.replace("/search ", "")
        if not question or question == "/search":
            # Mostrar sugerencias de búsqueda personalizadas
            user_id = message.from_user.id
            suggestions = self.search_service.get_search_suggestions(user_id)
            trending = self.search_service.get_trending_searches()
            
            suggestion_text = (
                "🔍 **Búsqueda Inteligente**\n\n"
                "❌ Formato correcto: `/search [tu consulta]`\n\n"
            )
            
            if suggestions:
                suggestion_text += "💡 **Sugerencias personalizadas:**\n"
                for suggestion in suggestions[:5]:
                    suggestion_text += f"• {suggestion}\n"
                suggestion_text += "\n"
            
            if trending:
                suggestion_text += "🔥 **Búsquedas populares:**\n"
                for trend in trending[:5]:
                    suggestion_text += f"• {trend}\n"
            
            suggestion_text += "\n📝 *Ejemplo:* `/search atomic design system`"
            
            self.bot.send_message(message.chat.id, suggestion_text, parse_mode="Markdown")
            return

        user_id = message.from_user.id
        if user_id in self.processing_users:
            self.bot.send_message(
                message.chat.id,
                "⏳ Ya estoy procesando tu consulta anterior. Por favor espera...",
            )
            return

        self.processing_users.add(user_id)
        
        # Actualizar contexto y estadísticas de búsqueda
        self.state_manager.update_user_context(user_id, "search")
        self.state_manager.update_search_stats(user_id, question)
        
        status_msg = None
        try:
            self.bot.send_chat_action(message.chat.id, "typing")
            status_msg = self.bot.send_message(
                message.chat.id,
                "🔍 Realizando búsqueda contextual inteligente..."
            )

            self.logger.info(f"Búsqueda contextual para usuario {user_id}: {question[:50]}...")

            # Usar búsqueda contextual avanzada
            enhanced_query, enhanced_filters = self.search_service.contextual_search(
                question, user_id
            )

            # Verificación de datos disponibles
            if not self.index_model or not self.chunks:
                try:
                    self.bot.delete_message(message.chat.id, status_msg.message_id)
                except:
                    pass
                self.bot.send_message(
                    message.chat.id,
                    "⚠️ No hay documentos procesados disponibles para búsqueda.",
                )
                return

            # Generación de embedding para la búsqueda mejorada
            question_embedding = embed_question(enhanced_query)
            if not question_embedding:
                try:
                    self.bot.delete_message(message.chat.id, status_msg.message_id)
                except:
                    pass
                self.bot.send_message(
                    message.chat.id,
                    "❌ No pude procesar tu consulta. Intenta con otra pregunta.",
                )
                return

            # Búsqueda semántica de documentos relevantes
            similar_chunks = search_similar_chunks_sklearn(
                question_embedding, self.index_model, self.chunks, top_k=5
            )

            if not similar_chunks:
                try:
                    self.bot.delete_message(message.chat.id, status_msg.message_id)
                except:
                    pass
                self.bot.send_message(
                    message.chat.id,
                    "❓ No encontré documentos relacionados con tu consulta.",
                )
                return

            # Actualizar mensaje de estado
            try:
                self.bot.edit_message_text(
                    "🤖 Generando respuesta personalizada con IA adaptativa...",
                    message.chat.id,
                    status_msg.message_id
                )
            except:
                pass

            # Generar respuesta usando IA adaptativa con contexto de documentos
            answer = self.adaptive_ai.generate_adaptive_response(
                question, "search", user_id, similar_chunks
            )

            # Eliminar mensaje de estado
            try:
                self.bot.delete_message(message.chat.id, status_msg.message_id)
            except:
                pass

            # Enviar la respuesta principal (dividida si es necesaria)
            if len(answer) > 4000:
                chunks = [answer[i : i + 4000] for i in range(0, len(answer), 4000)]
                for chunk in chunks:
                    self.bot.send_message(message.chat.id, chunk, parse_mode="Markdown")
            else:
                self.bot.send_message(
                    message.chat.id, answer, parse_mode="Markdown"
                )

            # Manejo mejorado de referencias
            if similar_chunks:
                # Diccionario para agrupar referencias por documento
                doc_refs = {}  # {documento: set(páginas)}

                # Extraer información única de documentos y páginas
                for chunk in similar_chunks:
                    doc_name = chunk.get("document", "")
                    if not doc_name:
                        continue

                    # Convertir a nombre base del documento
                    base_name = os.path.basename(doc_name)
                    pretty_name = base_name.replace(".pdf", "").replace("_", " ")

                    # Extraer páginas únicas
                    pages = chunk.get("pages", [])

                    # Agregar al diccionario, combinando las páginas si ya existe
                    if pretty_name in doc_refs:
                        doc_refs[pretty_name].update(pages)
                    else:
                        doc_refs[pretty_name] = set(pages)

                # Crear mensaje de referencias
                if doc_refs:
                    ref_text = "📚 Referencias consultadas:\n\n"

                    for doc_name, pages in doc_refs.items():
                        # Ordenar páginas para presentación
                        sorted_pages = sorted(pages)
                        pages_str = (
                            ", ".join(map(str, sorted_pages)) if sorted_pages else "N/A"
                        )
                        ref_text += f"• {doc_name} (Pág: {pages_str})\n"

                    # Enviar mensaje con referencias únicas
                    self.bot.send_message(message.chat.id, ref_text)

                    # Crear botones de descarga (solo uno por documento)
                    keyboard = types.InlineKeyboardMarkup()

                    for doc_pretty_name in doc_refs.keys():
                        # Buscar documento en sistema de archivos
                        for pdf_path in self.find_pdf_files(DOCUMENTS_FOLDER):
                            base_name = os.path.basename(pdf_path)
                            pdf_pretty_name = base_name.replace(".pdf", "").replace(
                                "_", " "
                            )

                            if pdf_pretty_name == doc_pretty_name:
                                # Encontramos el documento, crear botón de descarga
                                rel_path = os.path.relpath(pdf_path, DOCUMENTS_FOLDER)
                                keyboard.add(
                                    types.InlineKeyboardButton(
                                        f"📥 Descargar {doc_pretty_name}",
                                        callback_data=f"download#{rel_path}",
                                    )
                                )
                                break

                    # Enviar botones solo si hay documentos para descargar
                    if keyboard.keyboard:
                        self.bot.send_message(
                            message.chat.id,
                            "Selecciona un documento para descargar:",
                            reply_markup=keyboard,
                        )

            # Actualizar analytics de búsqueda
            response_time = time.perf_counter() - start_time
            self.admin_service.update_analytics('search', {
                'user_id': user_id,
                'query': question,
                'enhanced_query': enhanced_query,
                'results_count': len(similar_chunks),
                'response_time': response_time,
                'success': True
            })

        except Exception as e:
            self.logger.error(f"Error en handle_embedding_search para usuario {user_id}: {str(e)}")
            
            # Eliminar mensaje de estado si existe
            if status_msg:
                try:
                    self.bot.delete_message(message.chat.id, status_msg.message_id)
                except:
                    pass
            
            # Mensaje de error específico
            error_msg = "❌ Error al procesar tu búsqueda."
            if "timeout" in str(e).lower() or "connection" in str(e).lower():
                error_msg += "\n\n⏱️ El servicio está experimentando alta demanda. Por favor, intenta nuevamente en unos momentos."
            else:
                error_msg += "\n\n💡 Intenta reformular tu consulta o usar `/help` para ver otros comandos."
            
            self.bot.send_message(message.chat.id, error_msg)

            self.admin_service.update_analytics('search', {
                'user_id': user_id,
                'query': question,
                'success': False,
                'error': str(e)
            })
        finally:
            elapsed = time.perf_counter() - start_time
            self.logger.info(
                f"Tiempo de respuesta de handle_embedding_search para usuario {user_id}: {elapsed:.3f} segundos"
            )
            self.processing_users.discard(user_id)

    # Nuevos métodos para funcionalidades avanzadas
    def handle_preferences_command(self, message):
        """Maneja configuración de preferencias de usuario"""
        user_id = message.from_user.id
        session = self.state_manager.get_user_session(user_id)
        analytics = self.state_manager.get_user_analytics(user_id)
        
        preferences_text = (
            "⚙️ **Tus Preferencias Actuales**\n\n"
            f"👤 **Perfil:**\n"
            f"• Nivel de experiencia: {session.expertise_level.title()}\n"
            f"• Herramientas favoritas: {', '.join(session.favorite_tools) if session.favorite_tools else 'No definidas'}\n"
            f"• Áreas de interés: {', '.join(session.preferences.get('interests', [])) if session.preferences.get('interests') else 'No definidas'}\n\n"
            f"📊 **Tu Actividad:**\n"
            f"• Búsquedas realizadas: {analytics['searches_count']}\n"
            f"• Tiempo en sesión: {analytics['session_duration']/60:.1f} minutos\n"
            f"• Mensajes intercambiados: {analytics['conversation_length']}\n\n"
            "🎛️ **Configuraciones disponibles:**"
        )
        
        keyboard = types.InlineKeyboardMarkup()
        keyboard.add(
            types.InlineKeyboardButton("🎯 Cambiar nivel", callback_data="pref_level"),
            types.InlineKeyboardButton("🛠️ Editar herramientas", callback_data="pref_tools")
        )
        keyboard.add(
            types.InlineKeyboardButton("💡 Cambiar intereses", callback_data="pref_interests"),
            types.InlineKeyboardButton("🎨 Estilo respuestas", callback_data="pref_style")
        )
        keyboard.add(
            types.InlineKeyboardButton("🔄 Reiniciar onboarding", callback_data="pref_reset_onboarding")
        )
        
        self.bot.send_message(
            message.chat.id,
            preferences_text,
            reply_markup=keyboard,
            parse_mode="Markdown"
        )

    def handle_admin_command(self, message):
        """Maneja comandos de administración"""
        self.admin_service.handle_admin_command(message)

    def handle_callback_query(self, call):
        """Maneja todas las consultas de callback de forma centralizada"""
        user_id = call.from_user.id
        
        # Callbacks del onboarding
        if call.data.startswith("onb_"):
            self.onboarding_system.handle_onboarding_callback(call)
            
        # Callbacks de preferencias
        elif call.data.startswith("pref_"):
            self._handle_preferences_callback(call)
            
        # Callbacks de administración
        elif call.data.startswith("admin_"):
            if self.admin_service.is_admin(user_id):
                self._handle_admin_callback(call)
            else:
                self.bot.answer_callback_query(call.id, "❌ Sin permisos de admin")
                
        # Callbacks existentes
        elif call.data.startswith("list_"):
            self.handle_list(call)
        elif call.data.startswith("download#"):
            self.handle_pdf_download(call)
        elif call.data.startswith("back_"):
            self.handle_back(call)
        else:
            self.bot.answer_callback_query(call.id, "Comando no reconocido")

    def _handle_preferences_callback(self, call):
        """Maneja callbacks de configuración de preferencias"""
        action = call.data.replace("pref_", "")
        user_id = call.from_user.id
        
        if action == "level":
            self._show_level_selection(call)
        elif action == "tools":
            self._show_tools_selection(call)
        elif action == "interests":
            self._show_interests_selection(call)
        elif action == "style":
            self._show_style_selection(call)
        elif action == "reset_onboarding":
            self._reset_user_onboarding(call)

    def _show_level_selection(self, call):
        """Muestra selección de nivel de experiencia"""
        level_text = "🎯 **Selecciona tu nivel de experiencia:**"
        
        keyboard = types.InlineKeyboardMarkup()
        keyboard.add(
            types.InlineKeyboardButton("🌱 Principiante", callback_data="set_level_beginner")
        )
        keyboard.add(
            types.InlineKeyboardButton("🚀 Intermedio", callback_data="set_level_intermediate")
        )
        keyboard.add(
            types.InlineKeyboardButton("⭐ Avanzado", callback_data="set_level_expert")
        )
        keyboard.add(
            types.InlineKeyboardButton("⬅️ Volver", callback_data="pref_back")
        )
        
        try:
            self.bot.edit_message_text(
                level_text,
                call.message.chat.id,
                call.message.message_id,
                reply_markup=keyboard,
                parse_mode="Markdown"
            )
        except:
            self.bot.send_message(
                call.message.chat.id,
                level_text,
                reply_markup=keyboard,
                parse_mode="Markdown"
            )

    def _show_tools_selection(self, call):
        """Muestra selección de herramientas favoritas"""
        user_id = call.from_user.id
        session = self.state_manager.get_user_session(user_id)
        selected_tools = session.favorite_tools
        
        tools_text = (
            "🛠️ **Selecciona tus herramientas favoritas:**\n\n"
            f"Actualmente seleccionadas: {', '.join(selected_tools) if selected_tools else 'Ninguna'}"
        )
        
        tools = ["Figma", "Sketch", "Adobe XD", "InVision", "Framer", "Principle"]
        
        keyboard = types.InlineKeyboardMarkup()
        for tool in tools:
            emoji = "✅" if tool in selected_tools else "⚪"
            keyboard.add(
                types.InlineKeyboardButton(
                    f"{emoji} {tool}",
                    callback_data=f"toggle_tool_{tool}"
                )
            )
        
        keyboard.add(
            types.InlineKeyboardButton("💾 Guardar", callback_data="save_tools"),
            types.InlineKeyboardButton("⬅️ Volver", callback_data="pref_back")
        )
        
        try:
            self.bot.edit_message_text(
                tools_text,
                call.message.chat.id,
                call.message.message_id,
                reply_markup=keyboard,
                parse_mode="Markdown"
            )
        except:
            self.bot.send_message(
                call.message.chat.id,
                tools_text,
                reply_markup=keyboard,
                parse_mode="Markdown"
            )

    def _show_interests_selection(self, call):
        """Muestra selección de áreas de interés"""
        user_id = call.from_user.id
        session = self.state_manager.get_user_session(user_id)
        selected_interests = session.preferences.get('interests', [])
        
        interests_text = (
            "💡 **Selecciona tus áreas de interés:**\n\n"
            f"Actualmente seleccionadas: {', '.join(selected_interests) if selected_interests else 'Ninguna'}"
        )
        
        interests = ["UX Research", "UI Design", "Design Systems", "Prototyping", "Usability Testing", "Mobile Design"]
        
        keyboard = types.InlineKeyboardMarkup()
        for interest in interests:
            emoji = "✅" if interest in selected_interests else "⚪"
            keyboard.add(
                types.InlineKeyboardButton(
                    f"{emoji} {interest}",
                    callback_data=f"toggle_interest_{interest.replace(' ', '_')}"
                )
            )
        
        keyboard.add(
            types.InlineKeyboardButton("💾 Guardar", callback_data="save_interests"),
            types.InlineKeyboardButton("⬅️ Volver", callback_data="pref_back")
        )
        
        try:
            self.bot.edit_message_text(
                interests_text,
                call.message.chat.id,
                call.message.message_id,
                reply_markup=keyboard,
                parse_mode="Markdown"
            )
        except:
            self.bot.send_message(
                call.message.chat.id,
                interests_text,
                reply_markup=keyboard,
                parse_mode="Markdown"
            )

    def _show_style_selection(self, call):
        """Muestra selección de estilo de respuesta"""
        user_id = call.from_user.id
        session = self.state_manager.get_user_session(user_id)
        current_style = session.preferences.get('response_style', 'professional')
        
        style_text = (
            "🎨 **Selecciona tu estilo de respuesta preferido:**\n\n"
            f"Estilo actual: **{current_style.title()}**\n\n"
            "**Estilos disponibles:**\n"
            "• **Profesional:** Terminología técnica e industria\n"
            "• **Casual:** Conversacional y amigable\n"
            "• **Académico:** Rigor teórico y referencias\n"
            "• **Práctico:** Enfoque en ejemplos reales"
        )
        
        styles = [
            ("professional", "Profesional"),
            ("casual", "Casual"),
            ("academic", "Académico"),
            ("practical", "Práctico")
        ]
        
        keyboard = types.InlineKeyboardMarkup()
        for style_id, style_name in styles:
            emoji = "✅" if style_id == current_style else "⚪"
            keyboard.add(
                types.InlineKeyboardButton(
                    f"{emoji} {style_name}",
                    callback_data=f"set_style_{style_id}"
                )
            )
        
        keyboard.add(
            types.InlineKeyboardButton("⬅️ Volver", callback_data="pref_back")
        )
        
        try:
            self.bot.edit_message_text(
                style_text,
                call.message.chat.id,
                call.message.message_id,
                reply_markup=keyboard,
                parse_mode="Markdown"
            )
        except:
            self.bot.send_message(
                call.message.chat.id,
                style_text,
                reply_markup=keyboard,
                parse_mode="Markdown"
            )

    def _reset_user_onboarding(self, call):
        """Reinicia el proceso de onboarding para el usuario"""
        user_id = call.from_user.id
        session = self.state_manager.get_user_session(user_id)
        
        # Resetear configuraciones de onboarding
        session.preferences["onboarding_completed"] = False
        session.expertise_level = "intermediate"
        session.favorite_tools = []
        session.preferences["interests"] = []
        
        # Guardar cambios
        self.state_manager._save_sessions()
        
        reset_text = (
            "🔄 **Onboarding reiniciado**\n\n"
            "Tu perfil ha sido reseteado. Te guiaré nuevamente por el proceso de configuración."
        )
        
        try:
            self.bot.edit_message_text(
                reset_text,
                call.message.chat.id,
                call.message.message_id,
                parse_mode="Markdown"
            )
        except:
            self.bot.send_message(
                call.message.chat.id,
                reset_text,
                parse_mode="Markdown"
            )
        
        # Iniciar onboarding después de un momento
        time.sleep(2)
        self.onboarding_system.start_onboarding(call.message)

    def handle_analytics_command(self, message):
        """Muestra analytics personales del usuario"""
        user_id = message.from_user.id
        analytics = self.state_manager.get_user_analytics(user_id)
        session = self.state_manager.get_user_session(user_id)
        
        # Calcular tiempo de actividad
        session_hours = analytics['session_duration'] / 3600
        
        analytics_text = (
            "📊 **Tus Estadísticas Personales**\n\n"
            f"🎯 **Perfil:**\n"
            f"• Nivel: {analytics['expertise_level'].title()}\n"
            f"• Herramientas: {', '.join(analytics['favorite_tools']) if analytics['favorite_tools'] else 'No definidas'}\n\n"
            f"📈 **Actividad:**\n"
            f"• Búsquedas realizadas: {analytics['searches_count']}\n"
            f"• Conversaciones: {analytics['conversation_length']} mensajes\n"
            f"• Tiempo total: {session_hours:.1f} horas\n"
            f"• Promedio por sesión: {session_hours*60/max(1, analytics['searches_count']):.1f} min\n\n"
            f"💡 **Recomendaciones:**\n"
        )
        
        # Generar recomendaciones personalizadas
        if analytics['searches_count'] < 5:
            analytics_text += "• Explora más con `/search` para descubrir contenido relevante\n"
        
        if not analytics['favorite_tools']:
            analytics_text += "• Define tus herramientas favoritas en `/preferences`\n"
        
        if analytics['expertise_level'] == 'beginner' and analytics['searches_count'] > 10:
            analytics_text += "• Considera actualizar tu nivel a 'Intermedio' en preferencias\n"
        
        # Sugerencias de búsqueda
        suggestions = self.search_service.get_search_suggestions(user_id)
        if suggestions:
            analytics_text += f"\n🔍 **Sugerencias para ti:**\n"
            for suggestion in suggestions[:3]:
                analytics_text += f"• {suggestion}\n"
        
        self.bot.send_message(
            message.chat.id,
            analytics_text,
            parse_mode="Markdown"
        )

    def handle_trending_command(self, message):
        """Muestra contenido y búsquedas populares"""
        trending_searches = self.search_service.get_trending_searches()
        user_id = message.from_user.id
        user_suggestions = self.search_service.get_search_suggestions(user_id)
        
        trending_text = (
            "🔥 **Tendencias en DesignBot**\n\n"
            "📈 **Búsquedas populares esta semana:**\n"
        )
        
        for i, query in enumerate(trending_searches[:8], 1):
            trending_text += f"{i}. {query}\n"
        
        if user_suggestions:
            trending_text += f"\n💡 **Recomendado para ti:**\n"
            for suggestion in user_suggestions[:5]:
                trending_text += f"• {suggestion}\n"
        
        trending_text += (
            f"\n🎯 **Tips:**\n"
            f"• Usa `/search [término]` para explorar cualquier tema\n"
            f"• Combina términos para búsquedas más específicas\n"
            f"• Revisa `/analytics` para ver tu progreso personal"
        )
        
        # Agregar botones de acción rápida
        keyboard = types.InlineKeyboardMarkup()
        if trending_searches:
            # Botón para la búsqueda más popular
            top_search = trending_searches[0]
            keyboard.add(
                types.InlineKeyboardButton(
                    f"🔍 Buscar: {top_search[:25]}...",
                    callback_data=f"quick_search_{top_search[:20]}"
                )
            )
        
        keyboard.add(
            types.InlineKeyboardButton("📊 Mis estadísticas", callback_data="show_my_analytics"),
            types.InlineKeyboardButton("⚙️ Preferencias", callback_data="show_preferences")
        )
        
        self.bot.send_message(
            message.chat.id,
            trending_text,
            reply_markup=keyboard,
            parse_mode="Markdown"
        )

    def handle_tips_command(self, message):
        """Proporciona tips contextuales basados en el perfil del usuario"""
        user_id = message.from_user.id
        session = self.state_manager.get_user_session(user_id)
        
        # Tips personalizados por nivel
        level_tips = {
            "beginner": [
                "🌱 **Para principiantes:** Comienza con los fundamentos de UX/UI",
                "📚 Estudia los principios básicos de diseño visual",
                "👥 Aprende sobre research de usuarios paso a paso",
                "🎨 Familiarízate con herramientas como Figma",
                "📱 Practica con proyectos pequeños y recibe feedback"
            ],
            "intermediate": [
                "🚀 **Para intermedios:** Profundiza en metodologías específicas",
                "📊 Aprende a medir y validar tus diseños",
                "🎯 Crea tu primer design system personal",
                "🔄 Domina procesos de iteración y prototipado",
                "💼 Construye un portafolio sólido con case studies"
            ],
            "expert": [
                "⭐ **Para expertos:** Enfócate en liderazgo y estrategia",
                "📈 Conecta diseño con métricas de negocio",
                "👥 Mentoriza a otros diseñadores",
                "🏗️ Diseña sistemas escalables y arquitecturas",
                "🌍 Contribuye a la comunidad de diseño"
            ]
        }
        
        # Tips por herramientas favoritas
        tool_tips = {
            "Figma": [
                "💡 **Figma:** Usa Auto Layout para componentes responsive",
                "🔧 Configura design tokens para consistencia",
                "📚 Crea bibliotecas compartidas para tu equipo",
                "🎨 Aprovecha los plugins para automatizar tareas"
            ],
            "Sketch": [
                "💡 **Sketch:** Organiza con Symbols y Libraries",
                "🔄 Usa Sketch Cloud para colaboración",
                "📐 Configura grids y guides consistentes",
                "🎨 Explora plugins para funciones avanzadas"
            ],
            "Adobe XD": [
                "💡 **Adobe XD:** Aprovecha Voice Prototyping",
                "🔗 Usa componentes para diseño sistemático",
                "📱 Prototipos mobile con gestos avanzados",
                "☁️ Colabora en tiempo real con Creative Cloud"
            ]
        }
        
        # Tips por intereses
        interest_tips = {
            "UX Research": [
                "🔬 **UX Research:** Combina métodos cuali y cuantitativos",
                "👥 Entrevista usuarios regularmente",
                "📊 Valida hipótesis con pruebas A/B",
                "📝 Documenta insights de forma sistemática"
            ],
            "Design Systems": [
                "🎯 **Design Systems:** Comienza con atomic design",
                "📏 Define tokens antes que componentes",
                "📚 Documenta patrones y decisiones",
                "🔄 Itera basado en feedback del equipo"
            ]
        }
        
        # Seleccionar tips relevantes
        selected_tips = []
        
        # Tips por nivel (sempre incluir)
        level = session.expertise_level
        if level in level_tips:
            selected_tips.extend(level_tips[level][:3])
        
        # Tips por herramientas
        for tool in session.favorite_tools[:2]:  # Max 2 herramientas
            if tool in tool_tips:
                selected_tips.extend(tool_tips[tool][:2])
        
        # Tips por intereses
        interests = session.preferences.get('interests', [])
        for interest in interests[:2]:  # Max 2 intereses
            if interest in interest_tips:
                selected_tips.extend(interest_tips[interest][:2])
        
        # Tip general si no hay suficientes
        if len(selected_tips) < 3:
            selected_tips.append("💫 **General:** La práctica constante es clave en diseño")
            selected_tips.append("🔍 **Explora:** Usa `/search` para descubrir nuevos recursos")
        
        # Construir mensaje
        tips_text = (
            "💡 **Tips Personalizados para Ti**\n\n"
            f"Basado en tu perfil: {level.title()}"
        )
        
        if session.favorite_tools:
            tips_text += f" | {', '.join(session.favorite_tools[:2])}"
        
        tips_text += "\n\n"
        
        # Añadir tips seleccionados
        for i, tip in enumerate(selected_tips[:6], 1):
            tips_text += f"{i}. {tip}\n\n"
        
        tips_text += (
            "🚀 **Siguiente paso:**\n"
            "• Elige un tip y aplicalo en tu próximo proyecto\n"
            "• Usa `/search` para profundizar en temas específicos\n"
            "• Actualiza tus `/preferences` según evoluciones"
        )
        
        # Botones de acción
        keyboard = types.InlineKeyboardMarkup()
        keyboard.add(
            types.InlineKeyboardButton("🔍 Buscar recursos", callback_data="quick_search_resources"),
            types.InlineKeyboardButton("⚙️ Actualizar perfil", callback_data="show_preferences")
        )
        keyboard.add(
            types.InlineKeyboardButton("📊 Ver progreso", callback_data="show_my_analytics")
        )
        
        self.bot.send_message(
            message.chat.id,
            tips_text,
            reply_markup=keyboard,
            parse_mode="Markdown"
        )

    def _handle_admin_callback(self, call):
        """Maneja callbacks específicos de administración"""
        action = call.data.replace("admin_", "")
        
        if action == "broadcast_confirm":
            self._execute_broadcast(call)
        elif action == "broadcast_cancel":
            self._cancel_broadcast(call)
        elif action == "trends":
            self._show_detailed_trends(call)
        elif action == "active_users":
            self._show_active_users_detail(call)
        # Añadir más handlers según necesidad

    def _execute_broadcast(self, call):
        """Ejecuta el envío de mensaje broadcast"""
        if not hasattr(self, '_temp_broadcast_message'):
            self.bot.answer_callback_query(call.id, "❌ Mensaje broadcast no encontrado")
            return
        
        message = self._temp_broadcast_message
        sent_count = 0
        failed_count = 0
        
        # Enviar a todos los usuarios activos
        for user_id in self.state_manager.active_sessions.keys():
            try:
                self.bot.send_message(user_id, f"📢 **Mensaje del equipo:**\n\n{message}", parse_mode="Markdown")
                sent_count += 1
            except Exception as e:
                failed_count += 1
                self.logger.warning(f"Error enviando broadcast a {user_id}: {e}")
        
        # Reportar resultados
        result_text = (
            f"📢 **Broadcast completado**\n\n"
            f"✅ Enviado exitosamente: {sent_count}\n"
            f"❌ Fallos: {failed_count}\n"
            f"📊 Total intentos: {sent_count + failed_count}"
        )
        
        try:
            self.bot.edit_message_text(
                result_text,
                call.message.chat.id,
                call.message.message_id,
                parse_mode="Markdown"
            )
        except:
            self.bot.send_message(call.message.chat.id, result_text, parse_mode="Markdown")
        
        # Limpiar mensaje temporal
        delattr(self, '_temp_broadcast_message')

    def _cancel_broadcast(self, call):
        """Cancela el envío de broadcast"""
        if hasattr(self, '_temp_broadcast_message'):
            delattr(self, '_temp_broadcast_message')
        
        try:
            self.bot.edit_message_text(
                "❌ **Broadcast cancelado**\n\nEl mensaje no fue enviado.",
                call.message.chat.id,
                call.message.message_id,
                parse_mode="Markdown"
            )
        except:
            self.bot.send_message(
                call.message.chat.id,
                "❌ **Broadcast cancelado**",
                parse_mode="Markdown"
            )

    # Métodos auxiliares existentes continúan...
    def show_help(self, message_or_call):
        """Muestra mensaje de ayuda completo"""
        help_text = (
            "🎨 **DesignBot - Tu Asistente de UX/UI**\n\n"
            "**🚀 Comandos Principales:**\n"
            "• `/start` - Comenzar e inicializar perfil\n"
            "• `/help` - Mostrar esta ayuda\n\n"
            "**💬 Consultas Especializadas:**\n"
            "• `/design [pregunta]` - Consultas generales de diseño\n"
            "• `/ux [pregunta]` - Preguntas específicas sobre UX\n"
            "• `/ui [pregunta]` - Preguntas específicas sobre UI\n"
            "• `/tools [pregunta]` - Información sobre herramientas\n"
            "• `/ask [pregunta]` - Preguntas generales\n\n"
            "**🔍 Búsqueda Avanzada:**\n"
            "• `/search [término]` - Buscar en base de conocimientos\n"
            "• `/trending` - Ver búsquedas populares\n\n"
            "**⚙️ Personalización:**\n"
            "• `/preferences` - Configurar perfil\n"
            "• `/analytics` - Ver tus estadísticas\n"
            "• `/tips` - Consejos personalizados\n\n"
            "**📚 Recursos:**\n"
            "• `/list` - Explorar categorías de recursos\n\n"
            "💡 **Tip:** También puedes escribir directamente tus preguntas sin comandos."
        )
        
        keyboard = types.InlineKeyboardMarkup()
        keyboard.add(
            types.InlineKeyboardButton("🔍 Buscar recursos", callback_data="quick_search_help"),
            types.InlineKeyboardButton("⚙️ Configurar perfil", callback_data="show_preferences")
        )
        
        if hasattr(message_or_call, 'chat'):
            # Es un mensaje
            self.bot.send_message(
                message_or_call.chat.id,
                help_text,
                reply_markup=keyboard,
                parse_mode="Markdown"
            )
        else:
            # Es un callback
            try:
                self.bot.edit_message_text(
                    help_text,
                    message_or_call.message.chat.id,
                    message_or_call.message.message_id,
                    reply_markup=keyboard,
                    parse_mode="Markdown"
                )
            except:
                self.bot.send_message(
                    message_or_call.message.chat.id,
                    help_text,
                    reply_markup=keyboard,
                    parse_mode="Markdown"
                )

    def list_categories(self, message):
        """Muestra categorías de recursos disponibles"""
        categories_text = (
            "📚 **Explora Recursos por Categoría**\n\n"
            "Selecciona una categoría para ver los recursos disponibles:"
        )
        
        keyboard = types.InlineKeyboardMarkup()
        
        # Crear botones para cada categoría
        categories = [
            ("ux_research", "🔬 UX Research"),
            ("ui_patterns", "🖼️ UI Patterns"),
            ("design_systems", "🎯 Design Systems"),
            ("tools_guides", "🛠️ Tools & Guides"),
            ("prototyping", "🔧 Prototyping"),
            ("accessibility", "♿ Accessibility")
        ]
        
        for cat_id, cat_name in categories:
            keyboard.add(
                types.InlineKeyboardButton(
                    cat_name,
                    callback_data=f"list_{cat_id}"
                )
            )
        
        keyboard.add(
            types.InlineKeyboardButton("🔍 Búsqueda libre", callback_data="search_help")
        )
        
        self.bot.send_message(
            message.chat.id,
            categories_text,
            reply_markup=keyboard,
            parse_mode="Markdown"
        )

    def handle_list(self, call):
        """Maneja la selección de categorías de recursos"""
        category = call.data.replace("list_", "")
        
        category_info = {
            "ux_research": {
                "name": "🔬 UX Research",
                "description": "Métodos y técnicas de investigación de usuarios",
                "topics": [
                    "User interviews y encuestas",
                    "Personas y user journey mapping",
                    "Usability testing y análisis",
                    "Research synthesis y insights"
                ]
            },
            "ui_patterns": {
                "name": "🖼️ UI Patterns",
                "description": "Patrones de interfaz y componentes de diseño",
                "topics": [
                    "Navigation patterns",
                    "Form design y inputs",
                    "Cards y layouts",
                    "Micro-interactions"
                ]
            },
            "design_systems": {
                "name": "🎯 Design Systems",
                "description": "Sistemas de diseño y componentes reutilizables",
                "topics": [
                    "Atomic design methodology",
                    "Design tokens y variables",
                    "Component libraries",
                    "Documentation y governance"
                ]
            },
            "tools_guides": {
                "name": "🛠️ Tools & Guides",
                "description": "Guías de herramientas de diseño",
                "topics": [
                    "Figma advanced features",
                    "Sketch workflows",
                    "Adobe XD prototyping",
                    "Design handoff tools"
                ]
            },
            "prototyping": {
                "name": "🔧 Prototyping",
                "description": "Técnicas de prototipado y testing",
                "topics": [
                    "Low-fi wireframing",
                    "Interactive prototypes",
                    "Animation y transitions",
                    "Prototype testing"
                ]
            },
            "accessibility": {
                "name": "♿ Accessibility",
                "description": "Diseño inclusivo y accesibilidad",
                "topics": [
                    "WCAG guidelines",
                    "Color y contrast",
                    "Screen reader optimization",
                    "Inclusive design patterns"
                ]
            }
        }
        
        if category in category_info:
            info = category_info[category]
            
            detail_text = (
                f"{info['name']}\n\n"
                f"📋 **Descripción:**\n{info['description']}\n\n"
                f"📚 **Temas principales:**\n"
            )
            
            for topic in info['topics']:
                detail_text += f"• {topic}\n"
            
            detail_text += (
                f"\n💡 **Sugerencias:**\n"
                f"• Usa `/search [tema]` para buscar contenido específico\n"
                f"• Combina términos para búsquedas más precisas\n"
                f"• Explora recursos relacionados en otras categorías"
            )
            
            keyboard = types.InlineKeyboardMarkup()
            keyboard.add(
                types.InlineKeyboardButton(
                    f"🔍 Buscar en {info['name']}",
                    callback_data=f"quick_search_{category}"
                )
            )
            keyboard.add(
                types.InlineKeyboardButton("⬅️ Volver a categorías", callback_data="back_categories"),
                types.InlineKeyboardButton("🏠 Menú principal", callback_data="show_help")
            )
            
            try:
                self.bot.edit_message_text(
                    detail_text,
                    call.message.chat.id,
                    call.message.message_id,
                    reply_markup=keyboard,
                    parse_mode="Markdown"
                )
            except:
                self.bot.send_message(
                    call.message.chat.id,
                    detail_text,
                    reply_markup=keyboard,
                    parse_mode="Markdown"
                )
        else:
            self.bot.answer_callback_query(call.id, "Categoría no encontrada")

    def handle_pdf_download(self, call):
        """Maneja la descarga de documentos PDF"""
        try:
            doc_path = call.data.replace("download#", "")
            full_path = os.path.join(DOCUMENTS_FOLDER, doc_path)
            
            if os.path.exists(full_path) and full_path.endswith('.pdf'):
                # Obtener información del archivo
                file_size = os.path.getsize(full_path)
                file_name = os.path.basename(full_path)
                
                # Verificar tamaño del archivo (límite de Telegram: 50MB)
                if file_size > 50 * 1024 * 1024:
                    self.bot.answer_callback_query(
                        call.id,
                        "❌ Archivo demasiado grande para descargar por Telegram"
                    )
                    return
                
                # Enviar el archivo
                with open(full_path, 'rb') as doc:
                    self.bot.send_document(
                        call.message.chat.id,
                        doc,
                        caption=f"📄 **{file_name}**\n\n💡 Descargado desde DesignBot",
                        parse_mode="Markdown"
                    )
                
                self.bot.answer_callback_query(call.id, "✅ Descarga iniciada")
                
                # Actualizar analytics
                user_id = call.from_user.id
                self.admin_service.update_analytics('download', {
                    'user_id': user_id,
                    'file_name': file_name,
                    'file_size': file_size,
                    'success': True
                })
                
            else:
                self.bot.answer_callback_query(call.id, "❌ Archivo no encontrado")
                
        except Exception as e:
            self.logger.error(f"Error en handle_pdf_download: {str(e)}")
            self.bot.answer_callback_query(call.id, "❌ Error al descargar archivo")

    def handle_back(self, call):
        """Maneja la navegación hacia atrás"""
        action = call.data.replace("back_", "")
        
        if action == "categories":
            # Volver a la lista de categorías
            categories_text = (
                "📚 **Explora Recursos por Categoría**\n\n"
                "Selecciona una categoría para ver los recursos disponibles:"
            )
            
            keyboard = types.InlineKeyboardMarkup()
            
            categories = [
                ("ux_research", "🔬 UX Research"),
                ("ui_patterns", "🖼️ UI Patterns"),
                ("design_systems", "🎯 Design Systems"),
                ("tools_guides", "🛠️ Tools & Guides"),
                ("prototyping", "🔧 Prototyping"),
                ("accessibility", "♿ Accessibility")
            ]
            
            for cat_id, cat_name in categories:
                keyboard.add(
                    types.InlineKeyboardButton(
                        cat_name,
                        callback_data=f"list_{cat_id}"
                    )
                )
            
            keyboard.add(
                types.InlineKeyboardButton("🔍 Búsqueda libre", callback_data="search_help")
            )
            
            try:
                self.bot.edit_message_text(
                    categories_text,
                    call.message.chat.id,
                    call.message.message_id,
                    reply_markup=keyboard,
                    parse_mode="Markdown"
                )
            except:
                self.bot.send_message(
                    call.message.chat.id,
                    categories_text,
                    reply_markup=keyboard,
                    parse_mode="Markdown"
                )
        else:
            self.bot.answer_callback_query(call.id, "Acción no reconocida")

    def find_pdf_files(self, directory):
        """Encuentra todos los archivos PDF en el directorio y subdirectorios"""
        pdf_files = []
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.lower().endswith('.pdf'):
                    pdf_files.append(os.path.join(root, file))
        return pdf_files

    # ...resto de métodos existentes permanecen igual...
