#!/bin/bash

# Script para migrar DesignBot de Vercel a Render
echo "🚀 Migrando DesignBot de Vercel a Render..."

# Verificar archivo .env
if [ ! -f .env ]; then
    echo "❌ Error: No se encontró el archivo .env"
    echo "Crea un archivo .env con:"
    echo "TOKEN=tu_token_de_telegram"
    exit 1
fi

source .env

if [ -z "$TOKEN" ]; then
    echo "❌ Error: TOKEN no está definido en .env"
    exit 1
fi

echo "✅ TOKEN configurado correctamente"

# Eliminar webhook actual de Vercel
echo "🔄 Eliminando webhook de Vercel..."
curl -s -X POST "https://api.telegram.org/bot${TOKEN}/deleteWebhook" | python3 -c "import sys, json; print(json.dumps(json.load(sys.stdin), indent=2))"

echo ""
echo "📋 Instrucciones para completar la migración a Render:"
echo ""
echo "1. Ve a https://render.com y crea una cuenta (gratis)"
echo "2. Conecta tu repositorio de GitHub"
echo "3. Crea un nuevo 'Web Service'"
echo "4. Configura las variables de entorno:"
echo "   - TOKEN: ${TOKEN}"
echo "   - WEBHOOK_URL: https://tu-app.onrender.com (Render te dará esta URL)"
echo ""
echo "5. En 'Build Command' usa: pip install -r requirements.txt"
echo "6. En 'Start Command' usa: python app.py"
echo ""
echo "Una vez deployado en Render:"
echo "- El webhook se configurará automáticamente"
echo "- Tu bot estará disponible 24/7"
echo "- Podrás ver logs en tiempo real"
echo ""
echo "🎉 ¡Tu bot funcionará mucho mejor en Render que en Vercel!"