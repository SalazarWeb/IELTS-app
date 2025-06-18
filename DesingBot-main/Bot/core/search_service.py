from typing import Dict, List, Optional, Any
import time
import json
import os
from dataclasses import dataclass
from constants import LOGS_FOLDER

@dataclass
class SearchResult:
    content: str
    relevance_score: float
    document: str
    pages: List[int]
    category: str
    tags: List[str]

class AdvancedSearchService:
    def __init__(self, state_manager):
        self.state_manager = state_manager
        self.search_history_file = os.path.join(LOGS_FOLDER, "search_history.json")
        self.search_analytics = {}
        self._load_search_history()
    
    def contextual_search(self, query: str, user_id: int, filters: Dict = None) -> List[SearchResult]:
        """Búsqueda con contexto histórico y filtros"""
        session = self.state_manager.get_user_session(user_id)
        
        # Analizar historial de búsquedas del usuario
        user_context = self._get_user_search_context(user_id)
        
        # Aplicar filtros inteligentes basados en perfil
        enhanced_filters = self._enhance_filters_with_context(filters or {}, session)
        
        # Expandir query con sinónimos y términos relacionados
        enhanced_query = self._enhance_query_with_context(query, user_context, session)
        
        # Registrar búsqueda
        self._record_search(user_id, query, enhanced_filters)
        
        return enhanced_query, enhanced_filters
    
    def _get_user_search_context(self, user_id: int) -> Dict[str, Any]:
        """Analiza el historial de búsquedas del usuario"""
        user_searches = self.search_analytics.get(str(user_id), [])
        
        if not user_searches:
            return {"frequent_terms": [], "preferred_categories": [], "expertise_patterns": []}
        
        # Analizar términos frecuentes
        term_frequency = {}
        category_frequency = {}
        
        for search in user_searches[-20:]:  # Últimas 20 búsquedas
            query = search.get("query", "").lower()
            category = search.get("category", "")
            
            # Contar términos
            for term in query.split():
                if len(term) > 3:  # Ignorar palabras cortas
                    term_frequency[term] = term_frequency.get(term, 0) + 1
            
            # Contar categorías
            if category:
                category_frequency[category] = category_frequency.get(category, 0) + 1
        
        # Obtener términos más frecuentes
        frequent_terms = sorted(term_frequency.items(), key=lambda x: x[1], reverse=True)[:5]
        preferred_categories = sorted(category_frequency.items(), key=lambda x: x[1], reverse=True)[:3]
        
        return {
            "frequent_terms": [term for term, count in frequent_terms],
            "preferred_categories": [cat for cat, count in preferred_categories],
            "total_searches": len(user_searches),
            "recent_queries": [s["query"] for s in user_searches[-5:]]
        }
    
    def _enhance_query_with_context(self, query: str, user_context: Dict, session) -> str:
        """Mejora la query con contexto del usuario y sinónimos"""
        enhanced_terms = []
        query_lower = query.lower()
        
        # Diccionario de sinónimos y términos relacionados en UX/UI
        design_synonyms = {
            "usabilidad": ["usability", "user experience", "ux", "experiencia usuario"],
            "interfaz": ["interface", "ui", "user interface", "pantalla"],
            "prototipo": ["prototype", "mockup", "wireframe", "boceto"],
            "usuario": ["user", "cliente", "persona", "target"],
            "diseño": ["design", "visual", "gráfico", "estética"],
            "componente": ["component", "elemento", "widget", "control"],
            "navegación": ["navigation", "menú", "menu", "flujo"],
            "accesibilidad": ["accessibility", "a11y", "inclusivo", "universal"],
            "responsive": ["adaptable", "móvil", "mobile", "tablet"],
            "testing": ["prueba", "test", "validación", "evaluación"]
        }
        
        # Expandir con sinónimos
        for term in query.split():
            enhanced_terms.append(term)
            term_lower = term.lower()
            
            for key, synonyms in design_synonyms.items():
                if key in term_lower or term_lower in synonyms:
                    enhanced_terms.extend(synonyms[:2])  # Añadir max 2 sinónimos
                    break
        
        # Añadir términos frecuentes del usuario si son relevantes
        user_frequent = user_context.get("frequent_terms", [])
        for freq_term in user_frequent[:2]:  # Max 2 términos frecuentes
            if freq_term not in query_lower:
                enhanced_terms.append(freq_term)
        
        # Añadir contexto de herramientas favoritas
        favorite_tools = session.favorite_tools
        tool_context = {
            "Figma": ["component", "auto layout", "design system"],
            "Sketch": ["symbol", "artboard", "plugin"],
            "Adobe XD": ["prototype", "voice", "animation"],
            "InVision": ["collaboration", "handoff", "inspect"],
            "Framer": ["interaction", "code", "animation"]
        }
        
        for tool in favorite_tools:
            if tool in tool_context:
                # Añadir términos de herramienta si son relevantes al query
                for tool_term in tool_context[tool]:
                    if any(word in query_lower for word in ["componente", "animation", "prototipo", "interaction"]):
                        enhanced_terms.append(tool_term)
                        break
        
        return " ".join(enhanced_terms)
    
    def _enhance_filters_with_context(self, filters: Dict, session) -> Dict:
        """Mejora filtros basándose en el perfil del usuario"""
        enhanced_filters = filters.copy()
        
        # Filtro por nivel de experiencia
        if "complexity" not in enhanced_filters:
            complexity_mapping = {
                "beginner": ["basic", "introduction", "guide"],
                "intermediate": ["practical", "tips", "best practices"],
                "expert": ["advanced", "complex", "architecture"]
            }
            level = session.expertise_level
            enhanced_filters["preferred_complexity"] = complexity_mapping.get(level, [])
        
        # Filtro por herramientas favoritas
        if session.favorite_tools and "tools" not in enhanced_filters:
            enhanced_filters["preferred_tools"] = session.favorite_tools
        
        # Filtro por intereses
        interests = session.preferences.get("interests", [])
        if interests and "categories" not in enhanced_filters:
            category_mapping = {
                "UX Research": ["research", "user testing", "interviews"],
                "UI Design": ["interface", "visual", "components"],
                "Design Systems": ["system", "tokens", "library"],
                "Prototyping": ["prototype", "interaction", "animation"]
            }
            
            preferred_categories = []
            for interest in interests:
                if interest in category_mapping:
                    preferred_categories.extend(category_mapping[interest])
            
            enhanced_filters["preferred_categories"] = preferred_categories
        
        return enhanced_filters
    
    def _record_search(self, user_id: int, query: str, filters: Dict):
        """Registra la búsqueda para análisis futuro"""
        user_id_str = str(user_id)
        
        if user_id_str not in self.search_analytics:
            self.search_analytics[user_id_str] = []
        
        search_record = {
            "timestamp": time.time(),
            "query": query,
            "filters": filters,
            "category": filters.get("category", ""),
            "session_id": f"{user_id}_{int(time.time() // 3600)}"  # Sesión por hora
        }
        
        self.search_analytics[user_id_str].append(search_record)
        
        # Mantener solo últimas 100 búsquedas por usuario
        if len(self.search_analytics[user_id_str]) > 100:
            self.search_analytics[user_id_str] = self.search_analytics[user_id_str][-100:]
        
        self._save_search_history()
    
    def get_search_suggestions(self, user_id: int, partial_query: str = "") -> List[str]:
        """Genera sugerencias de búsqueda basadas en historial"""
        user_context = self._get_user_search_context(user_id)
        session = self.state_manager.get_user_session(user_id)
        
        suggestions = []
        
        # Sugerencias basadas en términos frecuentes
        frequent_terms = user_context.get("frequent_terms", [])
        for term in frequent_terms:
            if partial_query.lower() in term.lower():
                suggestions.append(f"🔍 {term}")
        
        # Sugerencias basadas en intereses
        interests = session.preferences.get("interests", [])
        interest_suggestions = {
            "UX Research": ["user interviews", "usability testing", "personas", "journey mapping"],
            "UI Design": ["design patterns", "components library", "color theory", "typography"],
            "Design Systems": ["atomic design", "design tokens", "style guide", "component library"],
            "Prototyping": ["interaction design", "micro animations", "user flow", "wireframing"]
        }
        
        for interest in interests:
            if interest in interest_suggestions:
                for suggestion in interest_suggestions[interest]:
                    if not partial_query or partial_query.lower() in suggestion.lower():
                        suggestions.append(f"💡 {suggestion}")
        
        # Sugerencias de herramientas
        for tool in session.favorite_tools:
            tool_suggestions = {
                "Figma": ["figma components", "figma auto layout", "figma plugins"],
                "Sketch": ["sketch symbols", "sketch libraries", "sketch plugins"],
                "Adobe XD": ["xd prototyping", "xd voice design", "xd collaboration"]
            }
            
            if tool in tool_suggestions:
                for suggestion in tool_suggestions[tool]:
                    if not partial_query or partial_query.lower() in suggestion.lower():
                        suggestions.append(f"🛠️ {suggestion}")
        
        return suggestions[:8]  # Máximo 8 sugerencias
    
    def get_trending_searches(self) -> List[str]:
        """Obtiene búsquedas populares de todos los usuarios"""
        all_searches = []
        
        # Recopilar todas las búsquedas recientes (última semana)
        week_ago = time.time() - (7 * 24 * 3600)
        
        for user_searches in self.search_analytics.values():
            for search in user_searches:
                if search.get("timestamp", 0) > week_ago:
                    all_searches.append(search["query"].lower())
        
        # Contar frecuencia
        query_frequency = {}
        for query in all_searches:
            # Normalizar query (quitar palabras comunes)
            clean_query = self._clean_query_for_trending(query)
            if clean_query:
                query_frequency[clean_query] = query_frequency.get(clean_query, 0) + 1
        
        # Obtener las más frecuentes
        trending = sorted(query_frequency.items(), key=lambda x: x[1], reverse=True)
        return [query for query, count in trending[:10] if count > 1]
    
    def _clean_query_for_trending(self, query: str) -> str:
        """Limpia query para análisis de tendencias"""
        # Palabras comunes a ignorar
        stop_words = {"como", "que", "para", "de", "la", "el", "en", "y", "a", "con", "por"}
        
        words = query.split()
        clean_words = [word for word in words if word not in stop_words and len(word) > 2]
        
        return " ".join(clean_words) if len(clean_words) >= 2 else ""
    
    def _save_search_history(self):
        """Guarda historial de búsquedas"""
        try:
            os.makedirs(LOGS_FOLDER, exist_ok=True)
            with open(self.search_history_file, 'w', encoding='utf-8') as f:
                json.dump(self.search_analytics, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error guardando historial de búsquedas: {e}")
    
    def _load_search_history(self):
        """Carga historial de búsquedas"""
        try:
            if os.path.exists(self.search_history_file):
                with open(self.search_history_file, 'r', encoding='utf-8') as f:
                    self.search_analytics = json.load(f)
        except Exception as e:
            print(f"Error cargando historial de búsquedas: {e}")
            self.search_analytics = {}