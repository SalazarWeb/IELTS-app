from telebot import types
from typing import Dict, List
import time

class OnboardingSystem:
    def __init__(self, bot, state_manager):
        self.bot = bot
        self.state_manager = state_manager
        self.onboarding_steps = {
            "welcome": self._step_welcome,
            "experience_level": self._step_experience_level,
            "favorite_tools": self._step_favorite_tools,
            "interests": self._step_interests,
            "complete": self._step_complete
        }
    
    def start_onboarding(self, message):
        """Inicia el proceso de onboarding para nuevos usuarios"""
        user_id = message.from_user.id
        session = self.state_manager.get_user_session(user_id)
        
        # Verificar si ya completó onboarding
        if session.preferences.get("onboarding_completed", False):
            self._show_main_menu(message)
            return
        
        session.current_context = "onboarding_welcome"
        self.state_manager.update_user_context(user_id, "onboarding_welcome")
        self._step_welcome(message)
    
    def handle_onboarding_callback(self, call):
        """Maneja callbacks del proceso de onboarding"""
        user_id = call.from_user.id
        session = self.state_manager.get_user_session(user_id)
        
        if call.data.startswith("onb_"):
            step_data = call.data.replace("onb_", "")
            
            if step_data == "start_tour":
                session.current_context = "onboarding_experience"
                self._step_experience_level(call.message)
            elif step_data.startswith("level_"):
                level = step_data.replace("level_", "")
                session.expertise_level = level
                session.preferences["experience_level"] = level
                session.current_context = "onboarding_tools"
                self._step_favorite_tools(call.message)
            elif step_data.startswith("tool_"):
                tool = step_data.replace("tool_", "")
                if tool not in session.favorite_tools:
                    session.favorite_tools.append(tool)
                # Continuar en la misma pantalla para seleccionar más herramientas
                self._step_favorite_tools(call.message, selected=session.favorite_tools)
            elif step_data == "tools_done":
                session.current_context = "onboarding_interests"
                self._step_interests(call.message)
            elif step_data.startswith("interest_"):
                interest = step_data.replace("interest_", "")
                interests = session.preferences.get("interests", [])
                if interest not in interests:
                    interests.append(interest)
                session.preferences["interests"] = interests
                # Continuar en la misma pantalla
                self._step_interests(call.message, selected=interests)
            elif step_data == "interests_done":
                session.current_context = "main"
                session.preferences["onboarding_completed"] = True
                self._step_complete(call.message)
    
    def _step_welcome(self, message):
        """Paso 1: Bienvenida"""
        welcome_text = (
            "🎨 **¡Bienvenido a DesignBot!**\n\n"
            "Soy tu asistente personal especializado en UX/UI Design. "
            "Te ayudo con:\n\n"
            "• 🔬 **Research de usuarios** y metodologías\n"
            "• 🎨 **Patrones UI** y componentes\n"
            "• 🎯 **Design Systems** y mejores prácticas\n"
            "• 🛠️ **Herramientas** como Figma, Sketch, Adobe XD\n"
            "• 📚 **Recursos especializados** de la industria\n\n"
            "💡 **Para ofrecerte la mejor experiencia, me gustaría conocerte mejor.**"
        )
        
        keyboard = types.InlineKeyboardMarkup()
        keyboard.add(
            types.InlineKeyboardButton("🚀 ¡Empecemos!", callback_data="onb_start_tour")
        )
        keyboard.add(
            types.InlineKeyboardButton("⏭️ Saltar introducción", callback_data="onb_interests_done")
        )
        
        self.bot.send_message(
            message.chat.id,
            welcome_text,
            reply_markup=keyboard,
            parse_mode="Markdown"
        )
    
    def _step_experience_level(self, message):
        """Paso 2: Nivel de experiencia"""
        experience_text = (
            "🎯 **¿Cuál es tu nivel de experiencia en UX/UI?**\n\n"
            "Esto me ayuda a adaptar mis respuestas a tu nivel:"
        )
        
        keyboard = types.InlineKeyboardMarkup()
        keyboard.add(
            types.InlineKeyboardButton("🌱 Principiante", callback_data="onb_level_beginner")
        )
        keyboard.add(
            types.InlineKeyboardButton("🚀 Intermedio", callback_data="onb_level_intermediate")
        )
        keyboard.add(
            types.InlineKeyboardButton("⭐ Avanzado", callback_data="onb_level_expert")
        )
        
        try:
            self.bot.edit_message_text(
                experience_text,
                message.chat.id,
                message.message_id,
                reply_markup=keyboard,
                parse_mode="Markdown"
            )
        except:
            self.bot.send_message(
                message.chat.id,
                experience_text,
                reply_markup=keyboard,
                parse_mode="Markdown"
            )
    
    def _step_favorite_tools(self, message, selected=None):
        """Paso 3: Herramientas favoritas"""
        if selected is None:
            selected = []
            
        tools_text = (
            "🛠️ **¿Qué herramientas de diseño usas más?**\n\n"
            f"Seleccionadas: {', '.join(selected) if selected else 'Ninguna'}\n\n"
            "Puedes seleccionar varias:"
        )
        
        tools = [
            ("Figma", "figma"),
            ("Sketch", "sketch"),
            ("Adobe XD", "adobe_xd"),
            ("InVision", "invision"),
            ("Framer", "framer"),
            ("Principle", "principle")
        ]
        
        keyboard = types.InlineKeyboardMarkup()
        for tool_name, tool_id in tools:
            emoji = "✅" if tool_name in selected else "⚪"
            keyboard.add(
                types.InlineKeyboardButton(
                    f"{emoji} {tool_name}", 
                    callback_data=f"onb_tool_{tool_name}"
                )
            )
        
        keyboard.add(
            types.InlineKeyboardButton("✨ Continuar", callback_data="onb_tools_done")
        )
        
        try:
            self.bot.edit_message_text(
                tools_text,
                message.chat.id,
                message.message_id,
                reply_markup=keyboard,
                parse_mode="Markdown"
            )
        except:
            self.bot.send_message(
                message.chat.id,
                tools_text,
                reply_markup=keyboard,
                parse_mode="Markdown"
            )
    
    def _step_interests(self, message, selected=None):
        """Paso 4: Áreas de interés"""
        if selected is None:
            selected = []
            
        interests_text = (
            "🎯 **¿Qué áreas te interesan más?**\n\n"
            f"Seleccionadas: {', '.join(selected) if selected else 'Ninguna'}\n\n"
            "Esto me ayuda a personalizar las recomendaciones:"
        )
        
        interests = [
            ("UX Research", "ux_research"),
            ("UI Design", "ui_design"),
            ("Design Systems", "design_systems"),
            ("Prototyping", "prototyping"),
            ("Usability Testing", "usability_testing"),
            ("Mobile Design", "mobile_design")
        ]
        
        keyboard = types.InlineKeyboardMarkup()
        for interest_name, interest_id in interests:
            emoji = "✅" if interest_name in selected else "⚪"
            keyboard.add(
                types.InlineKeyboardButton(
                    f"{emoji} {interest_name}",
                    callback_data=f"onb_interest_{interest_name}"
                )
            )
        
        keyboard.add(
            types.InlineKeyboardButton("🎉 ¡Finalizar!", callback_data="onb_interests_done")
        )
        
        try:
            self.bot.edit_message_text(
                interests_text,
                message.chat.id,
                message.message_id,
                reply_markup=keyboard,
                parse_mode="Markdown"
            )
        except:
            self.bot.send_message(
                message.chat.id,
                interests_text,
                reply_markup=keyboard,
                parse_mode="Markdown"
            )
    
    def _step_complete(self, message):
        """Paso 5: Completar onboarding"""
        user_id = message.from_user.id
        session = self.state_manager.get_user_session(user_id)
        
        # Crear resumen personalizado
        level_names = {
            "beginner": "Principiante 🌱",
            "intermediate": "Intermedio 🚀", 
            "expert": "Avanzado ⭐"
        }
        
        complete_text = (
            "🎉 **¡Perfil configurado exitosamente!**\n\n"
            f"**Tu nivel:** {level_names.get(session.expertise_level, 'Intermedio')}\n"
            f"**Herramientas favoritas:** {', '.join(session.favorite_tools) if session.favorite_tools else 'Ninguna seleccionada'}\n"
            f"**Áreas de interés:** {', '.join(session.preferences.get('interests', [])) if session.preferences.get('interests') else 'Ninguna seleccionada'}\n\n"
            "💡 **¡Ya estás listo para empezar!**\n\n"
            "Prueba estos comandos especializados:\n"
            "• `/ux` - Consultas sobre experiencia de usuario\n"
            "• `/ui` - Preguntas sobre interfaces\n"
            "• `/design` - Principios y teoría del diseño\n"
            "• `/search` - Buscar en recursos especializados\n\n"
            "🎯 **Tip:** Siempre puedes cambiar tus preferencias con `/preferences`"
        )
        
        # Crear menú principal adaptado al usuario
        keyboard = types.ReplyKeyboardMarkup(resize_keyboard=True, one_time_keyboard=False)
        
        # Personalizar menú según intereses
        interests = session.preferences.get('interests', [])
        if 'UX Research' in interests:
            keyboard.add(types.KeyboardButton("🔬 UX Research"))
        if 'UI Design' in interests:
            keyboard.add(types.KeyboardButton("🎨 UI Patterns"))
        if 'Design Systems' in interests:
            keyboard.add(types.KeyboardButton("🎯 Design Systems"))
        
        # Siempre mostrar herramientas y búsqueda
        keyboard.add(
            types.KeyboardButton("🛠️ Herramientas"),
            types.KeyboardButton("🔍 Búsqueda")
        )
        keyboard.add(types.KeyboardButton("❓ Ayuda"))
        
        try:
            self.bot.edit_message_text(
                complete_text,
                message.chat.id,
                message.message_id,
                parse_mode="Markdown"
            )
            # Enviar menú personalizado
            self.bot.send_message(
                message.chat.id,
                "🎨 **Tu menú personalizado está listo:**",
                reply_markup=keyboard,
                parse_mode="Markdown"
            )
        except:
            self.bot.send_message(
                message.chat.id,
                complete_text,
                reply_markup=keyboard,
                parse_mode="Markdown"
            )
    
    def _show_main_menu(self, message):
        """Muestra el menú principal para usuarios que ya completaron onboarding"""
        user_id = message.from_user.id
        session = self.state_manager.get_user_session(user_id)
        
        # Obtener analytics básicos
        analytics = self.state_manager.get_user_analytics(user_id)
        
        welcome_back_text = (
            f"👋 **¡Hola de nuevo!**\n\n"
            f"📊 **Tu actividad:**\n"
            f"• Búsquedas realizadas: {analytics['searches_count']}\n"
            f"• Nivel: {analytics['expertise_level'].title()}\n"
            f"• Herramientas favoritas: {', '.join(analytics['favorite_tools']) if analytics['favorite_tools'] else 'No definidas'}\n\n"
            "🎯 **¿En qué puedo ayudarte hoy?**"
        )
        
        # Menú personalizado
        keyboard = types.ReplyKeyboardMarkup(resize_keyboard=True, one_time_keyboard=False)
        interests = session.preferences.get('interests', [])
        
        if 'UX Research' in interests or not interests:
            keyboard.add(types.KeyboardButton("🔬 UX Research"))
        if 'UI Design' in interests or not interests:
            keyboard.add(types.KeyboardButton("🎨 UI Patterns"))
        if 'Design Systems' in interests or not interests:
            keyboard.add(types.KeyboardButton("🎯 Design Systems"))
        
        keyboard.add(
            types.KeyboardButton("🛠️ Herramientas"),
            types.KeyboardButton("🔍 Búsqueda")
        )
        keyboard.add(types.KeyboardButton("❓ Ayuda"))
        
        self.bot.send_message(
            message.chat.id,
            welcome_back_text,
            reply_markup=keyboard,
            parse_mode="Markdown"
        )