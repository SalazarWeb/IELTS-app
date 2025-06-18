# Script para configurar el webhook de Telegram con Vercel
echo "🔧 Configurando webhook de DesignBot..."

# Verificar que existe el archivo .env
if [ ! -f .env ]; then
    echo "❌ Error: No se encontró el archivo .env"
    echo "Crea un archivo .env con tu TOKEN de Telegram:"
    echo "TOKEN=tu_token_aqui"
    exit 1
fi

# Cargar variables de entorno
source .env

if [ -z "$TOKEN" ]; then
    echo "❌ Error: TOKEN no está definido en .env"
    exit 1
fi

# Obtener la URL de Vercel (debes reemplazar esto con tu URL real)
read -p "Ingresa tu URL de Vercel (ej: https://tu-app.vercel.app): " VERCEL_URL

if [ -z "$VERCEL_URL" ]; then
    echo "❌ Error: URL de Vercel requerida"
    exit 1
fi

# Configurar webhook
WEBHOOK_URL="${VERCEL_URL}/webhook"
API_URL="https://api.telegram.org/bot${TOKEN}/setWebhook"

echo "📡 Configurando webhook en: $WEBHOOK_URL"

# Enviar request para configurar webhook
response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"$WEBHOOK_URL\"}")

echo "📋 Respuesta de Telegram:"
echo "$response" | python3 -m json.tool

# Verificar estado del webhook
echo ""
echo "🔍 Verificando estado del webhook..."
curl -s "https://api.telegram.org/bot${TOKEN}/getWebhookInfo" | python3 -m json.tool

echo ""
echo "✅ Configuración completada!"
echo "🌐 Tu bot ahora debería estar funcionando 24/7 en: $VERCEL_URL"
echo "🔗 Webhook URL: $WEBHOOK_URL"
echo "💡 Prueba enviando un mensaje a tu bot en Telegram"