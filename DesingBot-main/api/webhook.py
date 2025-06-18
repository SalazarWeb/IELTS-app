import os
import json
import logging
from flask import Flask, request, jsonify
import telebot

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Obtener token desde variables de entorno
TOKEN = os.environ.get('TOKEN')
if not TOKEN:
    logger.error("TOKEN no encontrado en variables de entorno")
    raise ValueError("TOKEN environment variable is required")

# Inicializar bot
try:
    bot = telebot.TeleBot(TOKEN)
    logger.info(f"Bot inicializado correctamente con token: {TOKEN[:10]}...")
except Exception as e:
    logger.error(f"Error inicializando bot: {e}")
    raise

# Crear app Flask
app = Flask(__name__)

# Registrar handlers básicos del bot
@bot.message_handler(commands=['start'])
def start_command(message):
    """Handler para comando /start"""
    try:
        welcome_text = """
🎨 *¡Hola! Soy DesignBot*

Tu asistente personal de UX/UI Design.

*Comandos disponibles:*
/help - Ver todos los comandos
/design - Consejos de diseño
/ux - Temas de UX
/ui - Temas de UI
/tools - Herramientas recomendadas

¡Pregúntame cualquier cosa sobre diseño! 🚀
"""
        bot.reply_to(message, welcome_text, parse_mode='Markdown')
        logger.info(f"Comando /start procesado para usuario: {message.from_user.id}")
    except Exception as e:
        logger.error(f"Error en comando /start: {e}")
        bot.reply_to(message, "❌ Error procesando comando. Intenta de nuevo.")

@bot.message_handler(commands=['help'])
def help_command(message):
    """Handler para comando /help"""
    try:
        help_text = """
🎨 *DesignBot - Comandos Disponibles*

📋 *Comandos básicos:*
• /start - Iniciar el bot
• /help - Mostrar esta ayuda

🎯 *Comandos de diseño:*
• /design - Consejos generales de diseño
• /ux - Experiencia de usuario
• /ui - Interfaz de usuario
• /tools - Herramientas recomendadas

💬 *También puedes:*
• Escribir cualquier pregunta sobre diseño
• Pedirme consejos específicos
• Consultar sobre herramientas

¡Estoy aquí para ayudarte con tus proyectos de diseño! 🚀
"""
        bot.reply_to(message, help_text, parse_mode='Markdown')
        logger.info(f"Comando /help procesado para usuario: {message.from_user.id}")
    except Exception as e:
        logger.error(f"Error en comando /help: {e}")
        bot.reply_to(message, "❌ Error mostrando ayuda. Intenta de nuevo.")

@bot.message_handler(commands=['design', 'ux', 'ui', 'tools'])
def design_commands(message):
    """Handler para comandos de diseño"""
    try:
        command = message.text.split()[0].lower()
        
        responses = {
            '/design': """
🎨 *Consejos de Diseño General*

✨ *Principios básicos:*
• Simplicidad es clave
• Consistencia visual
• Jerarquía clara
• Contraste efectivo

🎯 *Tips prácticos:*
• Menos es más
• Espacios en blanco son tus amigos
• Tipografía legible
• Colores con propósito

¿Hay algo específico sobre diseño que te gustaría saber?
""",
            '/ux': """
👥 *Experiencia de Usuario (UX)*

🔍 *Fundamentos UX:*
• Investigación de usuarios
• Personas y journey maps
• Wireframes y prototipos
• Testing de usabilidad

💡 *Mejores prácticas:*
• Conoce a tu usuario
• Diseña para el contexto
• Haz testing temprano y frecuente
• Itera basándote en feedback

¿Quieres profundizar en algún tema específico de UX?
""",
            '/ui': """
🖼️ *Interfaz de Usuario (UI)*

🎨 *Elementos UI esenciales:*
• Botones y navegación
• Formularios intuitivos
• Iconografía clara
• Sistema de colores

⚡ *Principios UI:*
• Claridad visual
• Consistencia de patrones
• Feedback inmediato
• Accesibilidad

¿Te ayudo con algún componente específico de UI?
""",
            '/tools': """
🛠️ *Herramientas de Diseño Recomendadas*

🎨 *Para UI/UX:*
• Figma - Diseño colaborativo
• Adobe XD - Prototipado
• Sketch - Diseño de interfaces
• InVision - Prototipos interactivos

🔧 *Para desarrollo:*
• Zeplin - Handoff a desarrollo
• Abstract - Control de versiones
• Principle - Animaciones
• Lottie - Animaciones web

¿Necesitas ayuda eligiendo una herramienta específica?
"""
        }
        
        response = responses.get(command, "🤔 No encontré información para ese comando.")
        bot.reply_to(message, response, parse_mode='Markdown')
        logger.info(f"Comando {command} procesado para usuario: {message.from_user.id}")
        
    except Exception as e:
        logger.error(f"Error en comandos de diseño: {e}")
        bot.reply_to(message, "❌ Error procesando comando. Intenta de nuevo.")

@bot.message_handler(func=lambda message: True, content_types=['text'])
def handle_text(message):
    """Handler para mensajes de texto generales"""
    try:
        if message.text.startswith('/'):
            # Comando no reconocido
            bot.reply_to(message, "🤔 Comando no reconocido. Usa /help para ver comandos disponibles.")
        else:
            # Respuesta general a preguntas
            response = f"""
🎨 *Hola {message.from_user.first_name}!*

He recibido tu mensaje: "{message.text[:50]}..."

Puedo ayudarte con:
• Consejos de diseño (/design)
• Experiencia de usuario (/ux)  
• Interfaces de usuario (/ui)
• Herramientas de diseño (/tools)

¿Sobre qué aspecto del diseño te gustaría saber más?
"""
            bot.reply_to(message, response, parse_mode='Markdown')
            
        logger.info(f"Mensaje de texto procesado para usuario: {message.from_user.id}")
        
    except Exception as e:
        logger.error(f"Error procesando mensaje de texto: {e}")
        bot.reply_to(message, "❌ Error procesando tu mensaje. Intenta de nuevo.")

# Rutas de la aplicación Flask
@app.route('/webhook', methods=['POST'])
def webhook():
    """Endpoint principal para recibir actualizaciones de Telegram"""
    try:
        json_string = request.get_data().decode('utf-8')
        update = telebot.types.Update.de_json(json_string)
        bot.process_new_updates([update])
        
        logger.info(f"Webhook procesado exitosamente: update_id={update.update_id}")
        return jsonify({"status": "ok", "update_id": update.update_id})
        
    except Exception as e:
        logger.error(f"Error procesando webhook: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Endpoint de salud"""
    try:
        bot_info = bot.get_me()
        return jsonify({
            "status": "healthy",
            "bot_info": {
                "username": bot_info.username,
                "first_name": bot_info.first_name,
                "id": bot_info.id
            },
            "webhook_url": request.url_root + "webhook",
            "version": "3.0.0"
        })
    except Exception as e:
        logger.error(f"Error en health check: {e}")
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500

@app.route('/', methods=['GET'])
def index():
    """Página principal"""
    return jsonify({
        "message": "🎨 DesignBot API funcionando en Vercel!",
        "status": "online",
        "endpoints": {
            "webhook": "/webhook",
            "health": "/health"
        },
        "version": "3.0.0"
    })

# Para Vercel (esto es lo que Vercel ejecutará)
def handler(request, context=None):
    """Handler para Vercel"""
    return app(request.environ, lambda status, headers: None)

# Para testing local
if __name__ == '__main__':
    app.run(debug=True, port=5000)