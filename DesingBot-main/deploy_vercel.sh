#!/bin/bash

# Script completo para deployar DesignBot en Vercel
echo "🚀 Iniciando deployment de DesignBot en Vercel..."

# Verificar dependencias
echo "🔍 Verificando dependencias..."

# Verificar si Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "📦 Instalando Vercel CLI..."
    npm install -g vercel
fi

# Verificar archivo .env
if [ ! -f .env ]; then
    echo "❌ Error: No se encontró el archivo .env"
    echo "Crea un archivo .env con:"
    echo "TOKEN=tu_token_de_telegram"
    echo "Luego ejecuta este script nuevamente."
    exit 1
fi

# Cargar variables de entorno
source .env

if [ -z "$TOKEN" ]; then
    echo "❌ Error: TOKEN no está definido en .env"
    exit 1
fi

echo "✅ TOKEN configurado correctamente"

# Hacer deployment en Vercel
echo "🔄 Haciendo deployment en Vercel..."
vercel --prod

# Obtener URL del deployment
echo "🌐 Obteniendo URL del deployment..."
VERCEL_URL=$(vercel ls --limit=1 | grep -o 'https://[^ ]*' | head -1)

if [ -z "$VERCEL_URL" ]; then
    echo "⚠️  No se pudo obtener la URL automáticamente"
    read -p "Ingresa manualmente tu URL de Vercel: " VERCEL_URL
fi

echo "📡 URL del deployment: $VERCEL_URL"

# Configurar webhook
echo "🔧 Configurando webhook..."
WEBHOOK_URL="${VERCEL_URL}/webhook"
API_URL="https://api.telegram.org/bot${TOKEN}/setWebhook"

response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"$WEBHOOK_URL\"}")

echo "📋 Respuesta del webhook:"
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"

# Verificar estado
echo ""
echo "🔍 Verificando estado del webhook..."
curl -s "https://api.telegram.org/bot${TOKEN}/getWebhookInfo" | python3 -m json.tool 2>/dev/null

# Probar el endpoint de salud
echo ""
echo "🏥 Probando endpoint de salud..."
curl -s "${VERCEL_URL}/health" | python3 -m json.tool 2>/dev/null

echo ""
echo "🎉 ¡Deployment completado!"
echo "🌟 Tu bot está ahora funcionando 24/7 en: $VERCEL_URL"
echo "🔗 Webhook: $WEBHOOK_URL"
echo "💡 Prueba enviando /start a tu bot en Telegram"
echo ""
echo "📊 URLs importantes:"
echo "   - Bot: $VERCEL_URL"
echo "   - Health: $VERCEL_URL/health"
echo "   - Webhook: $WEBHOOK_URL"