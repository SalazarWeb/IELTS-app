# 🎓 Evaluador de Ensayos IELTS

Una aplicación web completa para practicar y evaluar ensayos IELTS Task 2 con temporizador de 20 minutos y evaluación automática.

## 🚀 Características

- **Temas aleatorios**: 10 temas auténticos de IELTS Task 2
- **Temporizador**: 20 minutos para completar el ensayo
- **Contador de palabras**: Mínimo 250 palabras requeridas
- **Evaluación automática**: Puntuación del 0 al 5
- **Retroalimentación**: Comentarios detallados sobre el ensayo
- **Interfaz responsive**: Funciona en dispositivos móviles y desktop

## 🛠️ Tecnologías

### Frontend
- React 18 con TypeScript
- Vite para el build
- CSS3 con diseño responsive

### Backend
- Node.js + Express
- CORS habilitado
- API RESTful

## 📦 Instalación y Ejecución

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm

### Backend

1. Navegar a la carpeta del backend:
```bash
cd backend
```

2. Instalar dependencias (ya instaladas):
```bash
npm install
```

3. Ejecutar el servidor:
```bash
npm start
```

El servidor se ejecutará en `http://localhost:5000`

### Frontend

1. Abrir una nueva terminal y navegar a la carpeta del frontend:
```bash
cd frontend
```

2. Instalar dependencias (ya instaladas):
```bash
npm install
```

3. Ejecutar la aplicación:
```bash
npm run dev
```

La aplicación se ejecutará en `http://localhost:5173`

## 🎯 Uso de la Aplicación

1. **Pantalla de Bienvenida**: Lee las instrucciones y presiona "Comenzar Prueba"
2. **Pantalla de Escritura**: 
   - Lee el tema asignado aleatoriamente
   - Escribe tu ensayo en el área de texto
   - Observa el temporizador (20 minutos)
   - Verifica el contador de palabras (mínimo 250)
   - Presiona "Evaluar Ensayo" cuando termines
3. **Pantalla de Resultados**:
   - Ve tu puntuación (0-5)
   - Verifica si aprobaste (≥3)
   - Lee la retroalimentación detallada
   - Presiona "Intentar de Nuevo" para otra prueba

## 🔧 API Endpoints

### GET /api/get-topic
Obtiene un tema aleatorio de IELTS Task 2.

**Respuesta:**
```json
{
  "topic": "Some people believe that technology has made our lives more complex..."
}
```

### POST /api/evaluate
Evalúa un ensayo y devuelve puntuación y retroalimentación.

**Request:**
```json
{
  "essay": "Technology has significantly changed our lives..."
}
```

**Respuesta:**
```json
{
  "score": 4,
  "status": "Aprobado",
  "feedback": "Excelente ensayo con buena estructura...",
  "wordCount": 287
}
```

### GET /api/health
Verifica el estado del servidor.

## 📝 Criterios de Evaluación

La evaluación actual es simulada y considera:

- **Longitud**: Mínimo 250 palabras
- **Estructura**: Uso de conectores (however, furthermore, therefore)
- **Conclusión**: Presencia de conclusión clara
- **Complejidad**: Promedio de palabras por oración
- **Extensión**: Bonificación por ensayos más extensos (>250 palabras)

## 🔮 Próximas Mejoras

- Integración con modelo de IA real (GPT, BERT, etc.)
- Evaluación más detallada por criterios IELTS
- Historial de ensayos
- Modo práctica sin temporizador
- Más temas de escritura

## 🐛 Solución de Problemas

### El frontend no se conecta al backend
- Verifica que el backend esté corriendo en puerto 5000
- Asegúrate de que no haya firewall bloqueando la conexión

### Error de CORS
- El backend ya tiene CORS configurado
- Verifica que las URLs coincidan (localhost:5000 y localhost:5173)

### Dependencias faltantes
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.