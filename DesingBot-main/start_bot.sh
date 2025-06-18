#!/bin/bash

# Script de inicio rápido para DesignBot
# Este script configura el entorno y ejecuta el bot

echo "🎨 Iniciando DesignBot..."

# Verificar si Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 no está instalado. Por favor instálalo primero."
    exit 1
fi

# Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    echo "📦 Creando entorno virtual..."
    python3 -m venv venv
fi

# Activar entorno virtual
echo "🔧 Activando entorno virtual..."
source venv/bin/activate

# Instalar dependencias
echo "📚 Instalando dependencias..."
pip install -r requirements.txt

# Verificar que existe el archivo .env
if [ ! -f ".env" ]; then
    echo "⚠️  Archivo .env no encontrado."
    echo "📋 Copia .env.example a .env y configura tus API keys:"
    echo "   cp .env.example .env"
    echo "   nano .env"
    exit 1
fi

# Crear carpetas necesarias
echo "📁 Creando estructura de carpetas..."
mkdir -p Bot/{data,logs}

# Ejecutar el bot
echo "🚀 Iniciando DesignBot..."
cd Bot && python main.py