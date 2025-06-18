#!/bin/bash

# Script para ejecutar DesignBot en segundo plano
# Uso: ./start_bot_background.sh [start|stop|restart|status]

BOT_DIR="/home/salazar/Documentos/Proyectos/DesingBot"
PID_FILE="$BOT_DIR/bot.pid"
LOG_FILE="$BOT_DIR/logs/bot_background.log"

start_bot() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "🤖 El bot ya está ejecutándose (PID: $PID)"
            return 1
        else
            rm -f "$PID_FILE"
        fi
    fi

    echo "🚀 Iniciando DesignBot en segundo plano..."
    cd "$BOT_DIR"
    
    # Activar entorno virtual y ejecutar en segundo plano
    nohup bash -c "source venv/bin/activate && python3 Bot/main.py" > "$LOG_FILE" 2>&1 &
    
    # Guardar PID
    echo $! > "$PID_FILE"
    
    echo "✅ Bot iniciado exitosamente!"
    echo "📁 PID guardado en: $PID_FILE"
    echo "📄 Logs en: $LOG_FILE"
    echo "🔍 Usa './start_bot_background.sh status' para verificar el estado"
}

stop_bot() {
    if [ ! -f "$PID_FILE" ]; then
        echo "❌ No se encontró archivo PID. El bot no parece estar ejecutándose."
        return 1
    fi

    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo "🛑 Deteniendo bot (PID: $PID)..."
        kill $PID
        rm -f "$PID_FILE"
        echo "✅ Bot detenido exitosamente."
    else
        echo "❌ El proceso no está ejecutándose."
        rm -f "$PID_FILE"
    fi
}

status_bot() {
    if [ ! -f "$PID_FILE" ]; then
        echo "❌ Bot no está ejecutándose (no hay archivo PID)"
        return 1
    fi

    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo "✅ Bot está ejecutándose (PID: $PID)"
        echo "📊 Información del proceso:"
        ps -p $PID -o pid,ppid,cmd,etime
        echo ""
        echo "📄 Últimas líneas del log:"
        tail -5 "$LOG_FILE"
    else
        echo "❌ Bot no está ejecutándose (proceso muerto)"
        rm -f "$PID_FILE"
    fi
}

restart_bot() {
    echo "🔄 Reiniciando bot..."
    stop_bot
    sleep 2
    start_bot
}

show_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo "📄 Mostrando logs del bot (Ctrl+C para salir):"
        tail -f "$LOG_FILE"
    else
        echo "❌ No se encontró archivo de log: $LOG_FILE"
    fi
}

case "$1" in
    start)
        start_bot
        ;;
    stop)
        stop_bot
        ;;
    restart)
        restart_bot
        ;;
    status)
        status_bot
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "🎨 DesignBot - Control de Servicio"
        echo ""
        echo "Uso: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Comandos:"
        echo "  start   - Iniciar el bot en segundo plano"
        echo "  stop    - Detener el bot"
        echo "  restart - Reiniciar el bot"
        echo "  status  - Ver estado del bot"
        echo "  logs    - Ver logs en tiempo real"
        echo ""
        exit 1
        ;;
esac