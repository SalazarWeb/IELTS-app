import os
import logging
from flask import Flask, request, jsonify
import telebot
from Bot.bot_handler import BotHandler

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Obtener configuración
TOKEN = os.environ.get('TOKEN')
WEBHOOK_URL = os.environ.get('WEBHOOK_URL')  # URL base de Render
PORT = int(os.environ.get('PORT', 5000))

if not TOKEN:
    raise ValueError("TOKEN environment variable is required")

# Inicializar bot
bot = telebot.TeleBot(TOKEN)

# Inicializar bot handler
try:
    bot_handler = BotHandler(bot=bot)
    logger.info("BotHandler inicializado correctamente")
except Exception as e:
    logger.error(f"Error inicializando BotHandler: {e}")
    bot_handler = None

# Crear app Flask
app = Flask(__name__)

# Configurar webhook automáticamente
def setup_webhook():
    """Configurar webhook automáticamente al iniciar"""
    if WEBHOOK_URL:
        webhook_url = f"{WEBHOOK_URL}/webhook"
        try:
            bot.remove_webhook()
            result = bot.set_webhook(url=webhook_url)
            if result:
                logger.info(f"Webhook configurado exitosamente: {webhook_url}")
            else:
                logger.error("Error configurando webhook")
        except Exception as e:
            logger.error(f"Error configurando webhook: {e}")

# Registrar handlers del bot
@bot.message_handler(commands=['start'])
def start_command(message):
    if bot_handler:
        bot_handler.start(message)
    else:
        welcome_text = """
🎨 *¡Hola! Soy DesignBot*

Tu asistente personal de UX/UI Design funcionando 24/7 en Render.

*Comandos disponibles:*
/help - Ver todos los comandos
/design - Consejos de diseño
/ux - Temas de UX
/ui - Temas de UI
/tools - Herramientas recomendadas

¡Pregúntame cualquier cosa sobre diseño! 🚀
"""
        bot.reply_to(message, welcome_text, parse_mode='Markdown')

@bot.message_handler(commands=['help'])
def help_command(message):
    if bot_handler:
        bot_handler.show_help(message)
    else:
        help_text = """
🎨 *DesignBot - Funcionando 24/7 en Render*

📋 *Comandos disponibles:*
• /start - Iniciar conversación
• /design - Consejos de diseño
• /ux - Experiencia de usuario
• /ui - Interfaz de usuario  
• /tools - Herramientas recomendadas
• /help - Esta ayuda

💡 *Ahora disponible 24/7 gracias a Render!*
"""
        bot.reply_to(message, help_text, parse_mode='Markdown')

@bot.message_handler(commands=['design', 'ux', 'ui', 'tools'])
def design_commands(message):
    if bot_handler:
        bot_handler.handle_general_question(message)
    else:
        # Respuestas básicas si el handler no está disponible
        command = message.text.split()[0].lower()
        responses = {
            '/design': "🎨 *Consejos de Diseño*\n\n• Simplicidad es clave\n• Consistencia visual\n• Jerarquía clara\n• Espacios en blanco efectivos",
            '/ux': "👥 *UX Design*\n\n• Investigación de usuarios\n• Wireframes y prototipos\n• Testing de usabilidad\n• Diseño centrado en el usuario",
            '/ui': "🖼️ *UI Design*\n\n• Sistemas de diseño\n• Tipografía legible\n• Colores con propósito\n• Componentes reutilizables",
            '/tools': "🛠️ *Herramientas Recomendadas*\n\n• Figma - Diseño colaborativo\n• Adobe XD - Prototipado\n• Sketch - Interfaces\n• InVision - Prototipos"
        }
        bot.reply_to(message, responses.get(command, "Comando no encontrado"), parse_mode='Markdown')

@bot.message_handler(func=lambda message: True, content_types=['text'])
def handle_text(message):
    if bot_handler:
        bot_handler.handle_general_question(message)
    else:
        response = f"🎨 Hola {message.from_user.first_name}! Soy DesignBot funcionando 24/7 en Render. Usa /help para ver comandos disponibles."
        bot.reply_to(message, response)

# Rutas Flask
@app.route('/webhook', methods=['POST'])
def webhook():
    try:
        json_string = request.get_data().decode('utf-8')
        update = telebot.types.Update.de_json(json_string)
        bot.process_new_updates([update])
        return jsonify({"status": "ok"})
    except Exception as e:
        logger.error(f"Error en webhook: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    try:
        bot_info = bot.get_me()
        return jsonify({
            "status": "healthy",
            "platform": "Render",
            "bot_info": {
                "username": bot_info.username,
                "first_name": bot_info.first_name,
                "id": bot_info.id
            },
            "webhook_configured": bool(WEBHOOK_URL),
            "bot_handler_loaded": bool(bot_handler)
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "message": "🎨 DesignBot funcionando 24/7 en Render!",
        "status": "online",
        "platform": "Render",
        "endpoints": {
            "webhook": "/webhook",
            "health": "/health"
        }
    })

if __name__ == '__main__':
    # Configurar webhook al iniciar
    setup_webhook()
    
    # Iniciar servidor
    logger.info(f"Iniciando servidor en puerto {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False)