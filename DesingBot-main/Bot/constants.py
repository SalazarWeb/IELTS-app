# constants.py
import os


ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


EMBEDDINGS_FILE = os.path.join(ROOT_DIR, "Bot", "data", "embeddings_data.pkl")
INDEX_FILE = os.path.join(ROOT_DIR, "Bot", "data", "vector_index.pkl")
DOCUMENTS_FOLDER = os.path.join(ROOT_DIR, "Bot", "Design_Resources")
LOGS_FOLDER = os.path.join(ROOT_DIR, "Bot", "logs")

# Categorías esenciales de recursos de diseño UX/UI (simplificadas y más accesibles)
DESIGN_CATEGORIES = {
    "UX_RESEARCH": "UX Research",
    "UI_PATTERNS": "UI Patterns", 
    "DESIGN_SYSTEMS": "Design Systems",
    "TOOLS_GUIDES": "Tools & Guides"
}

# Mapeo de categorías a emojis más claros y accesibles
CATEGORY_EMOJIS = {
    "UX_RESEARCH": "🔬",          # Microscopio para investigación
    "UI_PATTERNS": "🎨",          # Paleta para patrones visuales  
    "DESIGN_SYSTEMS": "🎯",       # Diana para sistemas organizados
    "TOOLS_GUIDES": "🛠️"          # Herramientas
}

# Descripciones claras para cada categoría (para mejorar accesibilidad)
CATEGORY_DESCRIPTIONS = {
    "UX_RESEARCH": "Investigación de usuarios, métodos, análisis",
    "UI_PATTERNS": "Componentes, interfaces, patrones visuales",
    "DESIGN_SYSTEMS": "Guías de estilo, bibliotecas de componentes", 
    "TOOLS_GUIDES": "Tutoriales de Figma, Sketch, Adobe XD"
}

# Herramientas de diseño soportadas
DESIGN_TOOLS = [
    "Figma",
    "Sketch",
    "Adobe XD", 
    "InVision",
    "Principle",
    "Framer",
    "Axure",
    "Balsamiq",
    "Marvel",
    "Zeplin"
]

# Nuevas constantes para funciones avanzadas
ADMIN_USER_IDS = [
    # Agrega aquí los IDs de usuarios administradores
    # Ejemplo: 123456789, 987654321
]

# Configuración de rate limiting
RATE_LIMITS = {
    'search_per_minute': 10,
    'questions_per_minute': 15,
    'max_daily_searches': 100,
    'max_daily_questions': 200
}

# Métricas de calidad del sistema
QUALITY_METRICS = {
    'response_time_target': 3.0,  # segundos
    'search_relevance_threshold': 0.7,
    'ai_success_rate_target': 95.0,
    'user_satisfaction_target': 4.0  # sobre 5
}

# Configuración de onboarding
ONBOARDING_CONFIG = {
    'welcome_delay': 2,  # segundos
    'step_delay': 1,
    'completion_reward': True
}

# Configuración de búsqueda contextual
SEARCH_CONFIG = {
    'max_results': 8,
    'similarity_threshold': 0.6,
    'context_window': 5,  # número de interacciones previas a considerar
    'trending_window_days': 7
}

# Configuración de IA adaptativa
AI_CONFIG = {
    'max_context_length': 2000,
    'response_styles': {
        'professional': 'formal, técnico, específico de la industria',
        'casual': 'conversacional, amigable, accesible',
        'academic': 'riguroso, con referencias, detallado',
        'practical': 'enfocado en ejemplos, aplicable, directo'
    },
    'expertise_adjustments': {
        'beginner': 'explicaciones básicas, terminología simple, ejemplos paso a paso',
        'intermediate': 'conceptos avanzados, mejores prácticas, casos de uso',
        'expert': 'estrategias complejas, tendencias, liderazgo'
    }
}

# Plantillas de mensajes
MESSAGE_TEMPLATES = {
    'welcome': {
        'title': '🎨 ¡Bienvenido a DesignBot!',
        'subtitle': 'Tu asistente personal de UX/UI Design',
        'description': 'Te ayudo con recursos, consejos y respuestas sobre diseño de experiencias e interfaces.'
    },
    'onboarding_complete': {
        'title': '🚀 ¡Configuración completada!',
        'message': 'Tu perfil está listo. Ahora recibirás recomendaciones personalizadas.'
    }
}

# Funciones auxiliares para el sistema

def sanitize_markdown(text):
    """
    Sanitiza texto para evitar errores de formato Markdown en Telegram
    """
    if not text:
        return text
    
    # Caracteres que pueden causar problemas en Markdown
    problematic_chars = ['*', '_', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']
    
    # Si el texto es muy largo, dividirlo
    if len(text) > 4000:
        chunks = []
        current_chunk = ""
        
        sentences = text.split('\n')
        for sentence in sentences:
            if len(current_chunk) + len(sentence) > 3800:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence
            else:
                current_chunk += "\n" + sentence if current_chunk else sentence
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    return text

def format_user_stats(analytics_data):
    """
    Formatea estadísticas de usuario para visualización
    """
    session_hours = analytics_data['session_duration'] / 3600
    avg_session = session_hours * 60 / max(1, analytics_data['searches_count'])
    
    return {
        'session_hours_formatted': f"{session_hours:.1f}",
        'avg_session_formatted': f"{avg_session:.1f}",
        'expertise_display': analytics_data['expertise_level'].title(),
        'tools_display': ', '.join(analytics_data['favorite_tools']) if analytics_data['favorite_tools'] else 'No definidas'
    }

def generate_search_suggestions(user_profile, trending_data):
    """
    Genera sugerencias de búsqueda personalizadas
    """
    suggestions = []
    
    # Sugerencias basadas en herramientas favoritas
    tool_suggestions = {
        'Figma': ['Auto Layout Figma', 'Componentes Figma', 'Design tokens Figma'],
        'Sketch': ['Symbols Sketch', 'Libraries Sketch', 'Plugins Sketch'],
        'Adobe XD': ['Prototipos XD', 'Voice prototyping', 'Componentes XD']
    }
    
    for tool in user_profile.get('favorite_tools', []):
        if tool in tool_suggestions:
            suggestions.extend(tool_suggestions[tool])
    
    # Sugerencias basadas en nivel de experiencia
    level_suggestions = {
        'beginner': ['Principios diseño UX', 'Fundamentos UI', 'Primeros pasos UX research'],
        'intermediate': ['Design systems', 'Usability testing', 'Prototipado avanzado'],
        'expert': ['Estrategia diseño', 'Design leadership', 'Métricas UX']
    }
    
    level = user_profile.get('expertise_level', 'intermediate')
    if level in level_suggestions:
        suggestions.extend(level_suggestions[level])
    
    # Agregar trending si hay espacio
    if len(suggestions) < 8 and trending_data:
        suggestions.extend(trending_data[:3])
    
    return list(dict.fromkeys(suggestions))  # Remover duplicados manteniendo orden
