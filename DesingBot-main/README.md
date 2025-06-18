# 🎨 DesignBot - Bot de Telegram para UX/UI

Bot inteligente de Telegram especializado en consultas de diseño UX/UI, con base de conocimientos integrada y capacidades de IA.

## 🚀 Despliegue en Vercel (24/7)

### Paso 1: Preparar el repositorio

1. **Crear repositorio en GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: DesignBot"
   git branch -M main
   git remote add origin https://github.com/SalazarWeb/designbot.git
   git push -u origin main
   ```

### Paso 2: Configurar Vercel

1. **Ir a [Vercel.com](https://vercel.com)**
2. **Conectar con GitHub**
3. **Importar repositorio `designbot`**
4. **Configurar como aplicación de funciones serverless**

### Paso 3: Configurar Variables de Entorno

En Vercel, ir a **Settings → Environment Variables** y agregar:
```
TOKEN=tu_token_de_botfather_aqui
FIRE=tu_api_key_fireworks
BOT_NAME=DesignBot
LOG_LEVEL=INFO
```

### Paso 4: Deploy Automático con Webhook

Vercel detectará automáticamente:
- ✅ `vercel.json` (configuración de funciones)
- ✅ `api/webhook.py` (endpoint de webhook)
- ✅ `requirements.txt` (dependencias Python)

El bot funcionará a través de webhooks, procesando mensajes de forma serverless.

## 🛠️ Comandos Disponibles

- `/start` - Iniciar el bot
- `/design` - Consultas generales de diseño
- `/ux` - Preguntas específicas sobre UX
- `/ui` - Preguntas específicas sobre UI
- `/tools` - Información sobre herramientas
- `/search` - Buscar en base de conocimientos
- `/help` - Mostrar ayuda completa

## 🏠 Ejecución Local

### Requisitos
- Python 3.8+
- Token de bot de Telegram (@BotFather)

### Instalación
```bash
# Clonar repositorio
git clone https://github.com/SalazarWeb/designbot.git
cd designbot

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate     # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar token
echo "TOKEN=tu_token_aqui" > .env

# Ejecutar bot
python Bot/main.py
```

### Ejecución en Segundo Plano
FIRE=tu_api_key_fireworks       # De Fireworks AI
BOT_NAME=DesignBot              # DesingBot
LOG_LEVEL=INFO                  # DEBUG, INFO, WARNING
```

## 📁 Estructura del Proyecto

```
DesignBot/
├── 📄 README.md                    # Documentación principal
├── 📄 requirements.txt             # Dependencias Python
├── 📄 .env.example                 # Plantilla de configuración
├── 🚀 start_bot.sh                 # Script de inicio rápido
├── 📁 Bot/                         # Código principal
│   ├── 🤖 main.py                  # Punto de entrada
│   ├── 🧠 bot_handler.py           # Lógica del bot
│   ├── ⚙️  constants.py            # Configuraciones
│   ├── 📝 logger.py                # Sistema de logs
│   ├── 📁 ai_embedding/            # Motor de IA
│   │   ├── 🔬 ai.py                # Generación de respuestas
│   │   └── 📊 extract.py           # Procesamiento de PDFs
│   └── 📁 Design_Resources/        # Biblioteca de recursos
│       ├── 🎨 UX_Research/
│       ├── 🖼️  UI_Patterns/
│       ├── 🎯 Design_Systems/
│       ├── 📱 Case_Studies/
│       ├── 🛠️  Tools_Guides/
│       ├── ♿ Accessibility/
│       ├── 🔧 Prototyping/
│       ├── 👥 User_Testing/
│       ├── 📐 Wireframing/
│       └── 🗂️  Information_Architecture/
├── 📁 data/                        # Embeddings e índices (auto-generado)
└── 📁 logs/                        # Archivos de log (auto-generado)
```

## 🎨 Ejemplos de Uso Avanzado

### 💬 **Conversaciones Típicas**

**Usuario:** `/ux cómo validar user personas`
**Bot:** *Respuesta detallada sobre métodos de validación, métricas, herramientas de testing...*

**Usuario:** `/search atomic design`
**Bot:** *Búsqueda en recursos + respuesta contextualizada con citas específicas*

**Usuario:** `/tools Figma auto layout`
**Bot:** *Guías paso a paso, mejores prácticas, tips avanzados...*

### 📊 **Flujo de Trabajo Típico**
1. **Explorar recursos** → Usar botones del menú
2. **Buscar específico** → `/search [tema]`
3. **Profundizar** → Comandos especializados (`/ux`, `/ui`, `/design`)
4. **Descargar recursos** → Botones de descarga automática

## 🚀 Características Avanzadas

### 🎯 **IA Especializada**
- **Contexto de diseño** - Respuestas enfocadas en UX/UI
- **Herramientas específicas** - Menciona Figma, Sketch, Adobe XD según contexto
- **Mejores prácticas** - Integra tendencias actuales y estándares
- **Ejemplos reales** - Casos de uso del mundo real

### 📖 **Gestión de Recursos**
- **Auto-indexación** - Procesa PDFs automáticamente
- **Búsqueda semántica** - Encuentra conceptos relacionados
- **Citas precisas** - Referencias con páginas específicas
- **Descargas directas** - Acceso inmediato a recursos

### 🔍 **Búsqueda Inteligente**
- **Embeddings optimizados** - Terminología de diseño especializada
- **Resultados contextuales** - Filtrado por categoría
- **Relevancia semántica** - Encuentra conceptos relacionados
- **Referencias cruzadas** - Conecta ideas entre documentos

## 📚 Agregar Contenido

### 📄 **Agregar PDFs**
1. Coloca archivos PDF en las carpetas correspondientes de `Design_Resources/`
2. Reinicia el bot para auto-indexar el contenido
3. Los nuevos recursos estarán disponibles inmediatamente

### 🏷️ **Categorías Recomendadas**
- **UX_Research**: Métodos, templates, case studies de research
- **UI_Patterns**: Componentes, design tokens, responsive patterns
- **Design_Systems**: Atomic design, style guides, documentation
- **Tools_Guides**: Tutoriales de Figma, Sketch, Adobe XD
- **Accessibility**: WCAG, inclusive design, testing methods

## 🤝 Contribuir

### 🎯 **Áreas Prioritarias**
- [ ] **📚 Recursos de calidad** - PDFs, guías, case studies
- [ ] **🔧 Mejoras de IA** - Prompts más específicos
- [ ] **🎨 Nuevas categorías** - Motion design, VR/AR UX
- [ ] **🔗 Integraciones** - APIs de Dribbble, Behance

### 📝 **Proceso de Contribución**
```bash
# 1. Fork del repositorio
git fork <este-repo>

# 2. Crear rama feature
git checkout -b feature/nueva-funcionalidad

# 3. Hacer cambios y commit
git commit -am "Añadir nueva funcionalidad"

# 4. Push y Pull Request
git push origin feature/nueva-funcionalidad
```

## 🆘 Resolución de Problemas

### ❌ **Errores Comunes**

**"No module named 'telebot'"**
```bash
pip install pyTelegramBotAPI
```

**"API Key inválida"**
- Verificar .env con TOKEN y FIRE correctos
- Comprobar que no haya espacios extra

**"No se encuentran documentos"**
- Verificar que existan PDFs en Design_Resources/
- Reiniciar bot para re-indexar

### 📊 **Logs y Debugging**
```bash
# Ver logs en tiempo real
tail -f Bot/logs/bot_log.log

# Logs de IA y embeddings
tail -f Bot/logs/ai.log
tail -f Bot/logs/data.log
```

## 📈 Roadmap

### 🎯 **V1.1 - Próximas Características**
- [ ] **🎨 Generación de imágenes** - Mockups y wireframes automáticos
- [ ] **📊 Analytics de uso** - Estadísticas de consultas populares
- [ ] **🔄 Sync con Figma** - Integración directa con archivos
- [ ] **👥 Colaboración** - Compartir hallazgos entre usuarios

### 🚀 **V2.0 - Visión a Largo Plazo**
- [ ] **🤖 Assistant mode** - Conversaciones contextuales largas
- [ ] **📱 Plugin mobile** - App nativa complementaria
- [ ] **🎓 Learning paths** - Rutas de aprendizaje personalizadas
- [ ] **🌐 Web interface** - Dashboard complementario

## 📞 Soporte

- **🐛 Issues**: Reportar bugs en GitHub Issues
- **💡 Ideas**: Sugerir mejoras en Discussions
- **📧 Contact**: Para consultas específicas

---

**🎨 Transformando ideas en experiencias excepcionales, un diseño a la vez.**

*Desarrollado para la comunidad de UX/UI Design*
