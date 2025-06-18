from dataclasses import dataclass
from typing import Dict, List, Optional, Any
import time
import json
import os
from constants import LOGS_FOLDER

@dataclass
class UserSession:
    user_id: int
    current_context: str
    last_search: Optional[str]
    preferences: Dict[str, Any]
    conversation_history: List[str]
    expertise_level: str = "intermediate"
    favorite_tools: List[str] = None
    search_count: int = 0
    session_start: float = None
    
    def __post_init__(self):
        if self.favorite_tools is None:
            self.favorite_tools = []
        if self.session_start is None:
            self.session_start = time.time()

class StateManager:
    def __init__(self):
        self.active_sessions: Dict[int, UserSession] = {}
        self.session_file = os.path.join(LOGS_FOLDER, "user_sessions.json")
        self._load_sessions()
    
    def get_user_session(self, user_id: int) -> UserSession:
        """Recupera o crea una sesión de usuario"""
        if user_id not in self.active_sessions:
            self.active_sessions[user_id] = UserSession(
                user_id=user_id,
                current_context="main",
                last_search=None,
                preferences={
                    "theme": "default",
                    "response_style": "professional",
                    "experience_level": "intermediate",
                    "notifications": True
                },
                conversation_history=[]
            )
        return self.active_sessions[user_id]
    
    def update_user_context(self, user_id: int, context: str):
        """Actualiza el contexto actual del usuario"""
        session = self.get_user_session(user_id)
        session.current_context = context
        self._save_sessions()
    
    def add_to_history(self, user_id: int, message: str):
        """Añade mensaje al historial de conversación"""
        session = self.get_user_session(user_id)
        session.conversation_history.append({
            "timestamp": time.time(),
            "message": message[:100],  # Truncar para ahorrar espacio
            "context": session.current_context
        })
        
        # Mantener solo los últimos 50 mensajes
        if len(session.conversation_history) > 50:
            session.conversation_history = session.conversation_history[-50:]
    
    def update_search_stats(self, user_id: int, query: str):
        """Actualiza estadísticas de búsqueda del usuario"""
        session = self.get_user_session(user_id)
        session.last_search = query
        session.search_count += 1
    
    def get_user_analytics(self, user_id: int) -> Dict[str, Any]:
        """Obtiene analytics del usuario"""
        session = self.get_user_session(user_id)
        session_duration = time.time() - session.session_start
        
        return {
            "searches_count": session.search_count,
            "session_duration": session_duration,
            "expertise_level": session.expertise_level,
            "favorite_tools": session.favorite_tools,
            "conversation_length": len(session.conversation_history),
            "last_activity": session.conversation_history[-1] if session.conversation_history else None
        }
    
    def _save_sessions(self):
        """Guarda sesiones en archivo"""
        try:
            os.makedirs(LOGS_FOLDER, exist_ok=True)
            # Convertir dataclasses a dict para serialización
            sessions_data = {}
            for user_id, session in self.active_sessions.items():
                sessions_data[str(user_id)] = {
                    "user_id": session.user_id,
                    "current_context": session.current_context,
                    "last_search": session.last_search,
                    "preferences": session.preferences,
                    "conversation_history": session.conversation_history[-10:],  # Solo últimos 10
                    "expertise_level": session.expertise_level,
                    "favorite_tools": session.favorite_tools,
                    "search_count": session.search_count,
                    "session_start": session.session_start
                }
            
            with open(self.session_file, 'w', encoding='utf-8') as f:
                json.dump(sessions_data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error guardando sesiones: {e}")
    
    def _load_sessions(self):
        """Carga sesiones desde archivo"""
        try:
            if os.path.exists(self.session_file):
                with open(self.session_file, 'r', encoding='utf-8') as f:
                    sessions_data = json.load(f)
                
                for user_id_str, data in sessions_data.items():
                    user_id = int(user_id_str)
                    self.active_sessions[user_id] = UserSession(**data)
        except Exception as e:
            print(f"Error cargando sesiones: {e}")
            self.active_sessions = {}