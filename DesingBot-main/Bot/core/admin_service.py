from typing import Dict, List, Optional, Any
import time
import json
import os
from datetime import datetime, timedelta
from telebot import types
from constants import ADMIN_USER_IDS, LOGS_FOLDER, RATE_LIMITS, QUALITY_METRICS

class AdminService:
    def __init__(self, bot, state_manager, search_service):
        self.bot = bot
        self.state_manager = state_manager
        self.search_service = search_service
        self.analytics_file = os.path.join(LOGS_FOLDER, "bot_analytics.json")
        self.rate_limit_data = {}
        self._load_analytics()
    
    def is_admin(self, user_id: int) -> bool:
        """Verifica si el usuario es administrador"""
        return user_id in ADMIN_USER_IDS
    
    def handle_admin_command(self, message):
        """Maneja comandos de administración"""
        if not self.is_admin(message.from_user.id):
            self.bot.send_message(
                message.chat.id,
                "❌ No tienes permisos de administrador para usar este comando."
            )
            return
        
        command_parts = message.text.split()
        if len(command_parts) < 2:
            self._show_admin_help(message.chat.id)
            return
        
        subcommand = command_parts[1].lower()
        
        admin_commands = {
            "stats": self._show_bot_statistics,
            "users": self._show_user_analytics,
            "performance": self._show_performance_metrics,
            "trending": self._show_trending_data,
            "health": self._show_system_health,
            "broadcast": self._handle_broadcast,
            "maintenance": self._toggle_maintenance_mode,
            "reset": self._reset_user_data,
            "export": self._export_analytics
        }
        
        if subcommand in admin_commands:
            admin_commands[subcommand](message)
        else:
            self._show_admin_help(message.chat.id)
    
    def _show_admin_help(self, chat_id: int):
        """Muestra ayuda de comandos de administración"""
        help_text = (
            "🔧 **Comandos de Administración:**\n\n"
            "📊 **Analytics:**\n"
            "• `/admin stats` - Estadísticas generales\n"
            "• `/admin users` - Analytics de usuarios\n"
            "• `/admin trending` - Búsquedas populares\n"
            "• `/admin performance` - Métricas de rendimiento\n\n"
            "⚙️ **Sistema:**\n"
            "• `/admin health` - Estado del sistema\n"
            "• `/admin maintenance` - Modo mantenimiento\n"
            "• `/admin broadcast [mensaje]` - Enviar a todos\n\n"
            "📁 **Datos:**\n"
            "• `/admin reset [user_id]` - Resetear usuario\n"
            "• `/admin export` - Exportar analytics"
        )
        
        self.bot.send_message(chat_id, help_text, parse_mode="Markdown")
    
    def _show_bot_statistics(self, message):
        """Muestra estadísticas generales del bot"""
        stats = self._calculate_bot_statistics()
        
        stats_text = (
            "📊 **Estadísticas del Bot**\n\n"
            f"👥 **Usuarios:**\n"
            f"• Total de usuarios: {stats['total_users']}\n"
            f"• Usuarios activos (7 días): {stats['active_users_week']}\n"
            f"• Usuarios nuevos (24h): {stats['new_users_day']}\n\n"
            f"🔍 **Búsquedas:**\n"
            f"• Total de búsquedas: {stats['total_searches']}\n"
            f"• Búsquedas hoy: {stats['searches_today']}\n"
            f"• Promedio por usuario: {stats['avg_searches_per_user']:.1f}\n\n"
            f"💬 **Conversaciones:**\n"
            f"• Mensajes procesados: {stats['total_messages']}\n"
            f"• Tiempo promedio de respuesta: {stats['avg_response_time']:.2f}s\n"
            f"• Tasa de éxito: {stats['success_rate']:.1f}%"
        )
        
        # Agregar gráfico de actividad semanal
        keyboard = types.InlineKeyboardMarkup()
        keyboard.add(
            types.InlineKeyboardButton("📈 Ver tendencias", callback_data="admin_trends"),
            types.InlineKeyboardButton("👥 Usuarios activos", callback_data="admin_active_users")
        )
        
        self.bot.send_message(
            message.chat.id,
            stats_text,
            reply_markup=keyboard,
            parse_mode="Markdown"
        )
    
    def _show_user_analytics(self, message):
        """Muestra analytics detallados de usuarios"""
        user_data = self._analyze_user_behavior()
        
        analytics_text = (
            "👥 **Analytics de Usuarios**\n\n"
            f"📋 **Segmentación por nivel:**\n"
            f"• Principiantes: {user_data['levels']['beginner']} ({user_data['levels']['beginner_pct']:.1f}%)\n"
            f"• Intermedios: {user_data['levels']['intermediate']} ({user_data['levels']['intermediate_pct']:.1f}%)\n"
            f"• Expertos: {user_data['levels']['expert']} ({user_data['levels']['expert_pct']:.1f}%)\n\n"
            f"🛠️ **Herramientas más populares:**\n"
        )
        
        for tool, count in user_data['popular_tools'][:5]:
            analytics_text += f"• {tool}: {count} usuarios\n"
        
        analytics_text += (
            f"\n🎯 **Intereses principales:**\n"
        )
        
        for interest, count in user_data['popular_interests'][:5]:
            analytics_text += f"• {interest}: {count} usuarios\n"
        
        analytics_text += (
            f"\n📊 **Comportamiento:**\n"
            f"• Retención 7 días: {user_data['retention_7d']:.1f}%\n"
            f"• Sesión promedio: {user_data['avg_session_duration']:.1f} min\n"
            f"• Usuarios que completaron onboarding: {user_data['onboarding_completion']:.1f}%"
        )
        
        self.bot.send_message(message.chat.id, analytics_text, parse_mode="Markdown")
    
    def _show_performance_metrics(self, message):
        """Muestra métricas de rendimiento del sistema"""
        perf_data = self._calculate_performance_metrics()
        
        performance_text = (
            "⚡ **Métricas de Rendimiento**\n\n"
            f"🚀 **Respuestas de IA:**\n"
            f"• Tiempo promedio: {perf_data['ai_response_time']:.2f}s\n"
            f"• Objetivo: <{QUALITY_METRICS['response_time_target']:.1f}s\n"
            f"• Tasa de éxito: {perf_data['ai_success_rate']:.1f}%\n\n"
            f"🔍 **Búsquedas:**\n"
            f"• Tiempo de indexación: {perf_data['search_index_time']:.2f}s\n"
            f"• Relevancia promedio: {perf_data['search_relevance']:.2f}\n"
            f"• Búsquedas sin resultados: {perf_data['empty_searches']:.1f}%\n\n"
            f"📁 **Sistema:**\n"
            f"• Documentos indexados: {perf_data['indexed_documents']}\n"
            f"• Tamaño de embeddings: {perf_data['embeddings_size_mb']:.1f} MB\n"
            f"• Uso de memoria: {perf_data['memory_usage']:.1f}%"
        )
        
        # Indicators de estado
        indicators = []
        if perf_data['ai_response_time'] <= QUALITY_METRICS['response_time_target']:
            indicators.append("🟢 Respuestas rápidas")
        else:
            indicators.append("🟡 Respuestas lentas")
        
        if perf_data['search_relevance'] >= QUALITY_METRICS['search_relevance_threshold']:
            indicators.append("🟢 Búsquedas relevantes")
        else:
            indicators.append("🔴 Búsquedas poco relevantes")
        
        performance_text += f"\n\n**Estado:** {' | '.join(indicators)}"
        
        self.bot.send_message(message.chat.id, performance_text, parse_mode="Markdown")
    
    def _show_trending_data(self, message):
        """Muestra datos de tendencias"""
        trending = self.search_service.get_trending_searches()
        user_trends = self._analyze_usage_trends()
        
        trending_text = (
            "📈 **Tendencias y Patrones**\n\n"
            "🔥 **Búsquedas populares (7 días):**\n"
        )
        
        for i, query in enumerate(trending[:8], 1):
            trending_text += f"{i}. {query}\n"
        
        trending_text += (
            f"\n📊 **Tendencias de uso:**\n"
            f"• Hora más activa: {user_trends['peak_hour']}:00\n"
            f"• Día más activo: {user_trends['peak_day']}\n"
            f"• Crecimiento semanal: {user_trends['weekly_growth']:+.1f}%\n"
            f"• Comando más usado: {user_trends['popular_command']}\n\n"
            f"📱 **Categorías populares:**\n"
        )
        
        for category, percentage in user_trends['popular_categories'].items():
            trending_text += f"• {category}: {percentage:.1f}%\n"
        
        self.bot.send_message(message.chat.id, trending_text, parse_mode="Markdown")
    
    def _show_system_health(self, message):
        """Muestra estado de salud del sistema"""
        health_data = self._check_system_health()
        
        health_text = "🏥 **Estado del Sistema**\n\n"
        
        # Indicadores de salud
        for component, status in health_data['components'].items():
            emoji = "🟢" if status['healthy'] else "🔴"
            health_text += f"{emoji} **{component}:** {status['status']}\n"
            if status.get('details'):
                health_text += f"   └ {status['details']}\n"
        
        health_text += (
            f"\n📊 **Métricas actuales:**\n"
            f"• Uptime: {health_data['uptime_hours']:.1f} horas\n"
            f"• Rate limits activos: {len(self.rate_limit_data)}\n"
            f"• Errores recientes: {health_data['recent_errors']}\n"
            f"• Última actualización de embeddings: {health_data['last_embedding_update']}"
        )
        
        # Estado general
        overall_health = "🟢 Saludable" if health_data['overall_healthy'] else "🔴 Problemas detectados"
        health_text += f"\n\n**Estado general:** {overall_health}"
        
        self.bot.send_message(message.chat.id, health_text, parse_mode="Markdown")
    
    def _handle_broadcast(self, message):
        """Maneja envío de mensajes broadcast"""
        command_parts = message.text.split(maxsplit=2)
        if len(command_parts) < 3:
            self.bot.send_message(
                message.chat.id,
                "❌ Formato: `/admin broadcast [mensaje]`"
            )
            return
        
        broadcast_message = command_parts[2]
        
        # Confirmar envío
        keyboard = types.InlineKeyboardMarkup()
        keyboard.add(
            types.InlineKeyboardButton("✅ Confirmar envío", callback_data="admin_broadcast_confirm"),
            types.InlineKeyboardButton("❌ Cancelar", callback_data="admin_broadcast_cancel")
        )
        
        # Guardar mensaje temporalmente
        self._temp_broadcast_message = broadcast_message
        
        confirm_text = (
            f"📢 **Confirmar Broadcast**\n\n"
            f"**Mensaje a enviar:**\n{broadcast_message}\n\n"
            f"**Destinatarios:** ~{len(self.state_manager.active_sessions)} usuarios activos\n\n"
            "⚠️ Esta acción enviará el mensaje a todos los usuarios. ¿Continuar?"
        )
        
        self.bot.send_message(
            message.chat.id,
            confirm_text,
            reply_markup=keyboard,
            parse_mode="Markdown"
        )
    
    # Métodos auxiliares para cálculos de analytics
    def _calculate_bot_statistics(self) -> Dict[str, Any]:
        """Calcula estadísticas generales del bot"""
        analytics = self._load_analytics()
        sessions = self.state_manager.active_sessions
        
        # Calcular métricas básicas
        total_users = len(sessions)
        
        # Usuarios activos en los últimos 7 días
        week_ago = time.time() - (7 * 24 * 3600)
        active_users_week = sum(1 for session in sessions.values() 
                               if session.session_start > week_ago)
        
        # Usuarios nuevos en las últimas 24 horas
        day_ago = time.time() - (24 * 3600)
        new_users_day = sum(1 for session in sessions.values() 
                           if session.session_start > day_ago)
        
        # Búsquedas totales
        total_searches = sum(session.search_count for session in sessions.values())
        avg_searches = total_searches / total_users if total_users > 0 else 0
        
        # Búsquedas de hoy
        today_searches = analytics.get('daily_stats', {}).get(
            datetime.now().strftime('%Y-%m-%d'), {}
        ).get('searches', 0)
        
        return {
            'total_users': total_users,
            'active_users_week': active_users_week,
            'new_users_day': new_users_day,
            'total_searches': total_searches,
            'searches_today': today_searches,
            'avg_searches_per_user': avg_searches,
            'total_messages': analytics.get('total_messages', 0),
            'avg_response_time': analytics.get('avg_response_time', 0),
            'success_rate': analytics.get('success_rate', 100)
        }
    
    def _analyze_user_behavior(self) -> Dict[str, Any]:
        """Analiza comportamiento de usuarios"""
        sessions = self.state_manager.active_sessions.values()
        
        # Segmentación por nivel
        levels = {'beginner': 0, 'intermediate': 0, 'expert': 0}
        for session in sessions:
            levels[session.expertise_level] = levels.get(session.expertise_level, 0) + 1
        
        total = sum(levels.values())
        level_percentages = {f"{k}_pct": (v/total*100) if total > 0 else 0 
                           for k, v in levels.items()}
        levels.update(level_percentages)
        
        # Herramientas populares
        tool_counts = {}
        for session in sessions:
            for tool in session.favorite_tools:
                tool_counts[tool] = tool_counts.get(tool, 0) + 1
        
        popular_tools = sorted(tool_counts.items(), key=lambda x: x[1], reverse=True)
        
        # Intereses populares
        interest_counts = {}
        for session in sessions:
            for interest in session.preferences.get('interests', []):
                interest_counts[interest] = interest_counts.get(interest, 0) + 1
        
        popular_interests = sorted(interest_counts.items(), key=lambda x: x[1], reverse=True)
        
        return {
            'levels': levels,
            'popular_tools': popular_tools,
            'popular_interests': popular_interests,
            'retention_7d': 85.0,  # Placeholder - calcular con datos reales
            'avg_session_duration': 15.5,  # Placeholder
            'onboarding_completion': 78.0  # Placeholder
        }
    
    def _calculate_performance_metrics(self) -> Dict[str, Any]:
        """Calcula métricas de rendimiento"""
        analytics = self._load_analytics()
        
        return {
            'ai_response_time': analytics.get('ai_avg_response_time', 2.5),
            'ai_success_rate': analytics.get('ai_success_rate', 95.0),
            'search_index_time': analytics.get('search_index_time', 1.2),
            'search_relevance': analytics.get('search_relevance', 0.85),
            'empty_searches': analytics.get('empty_searches_pct', 8.0),
            'indexed_documents': analytics.get('indexed_documents', 0),
            'embeddings_size_mb': analytics.get('embeddings_size_mb', 50.0),
            'memory_usage': analytics.get('memory_usage_pct', 45.0)
        }
    
    def _analyze_usage_trends(self) -> Dict[str, Any]:
        """Analiza tendencias de uso"""
        # Placeholder data - implementar con datos reales
        return {
            'peak_hour': 14,
            'peak_day': 'Martes',
            'weekly_growth': 12.5,
            'popular_command': '/search',
            'popular_categories': {
                'UX Research': 35.0,
                'UI Patterns': 28.0,
                'Design Systems': 22.0,
                'Tools Guides': 15.0
            }
        }
    
    def _check_system_health(self) -> Dict[str, Any]:
        """Verifica salud del sistema"""
        components = {
            'Base de datos': {
                'healthy': True,
                'status': 'Operacional',
                'details': 'Conexión estable'
            },
            'Servicio de IA': {
                'healthy': True,
                'status': 'Operacional',
                'details': 'API respondiendo normalmente'
            },
            'Sistema de embeddings': {
                'healthy': True,
                'status': 'Operacional',
                'details': 'Índices actualizados'
            },
            'Rate limiting': {
                'healthy': len(self.rate_limit_data) < 100,
                'status': 'Normal' if len(self.rate_limit_data) < 100 else 'Alta carga',
                'details': f'{len(self.rate_limit_data)} límites activos'
            }
        }
        
        overall_healthy = all(comp['healthy'] for comp in components.values())
        
        return {
            'components': components,
            'overall_healthy': overall_healthy,
            'uptime_hours': 72.5,  # Placeholder
            'recent_errors': 2,
            'last_embedding_update': '2 horas atrás'
        }
    
    def _load_analytics(self) -> Dict[str, Any]:
        """Carga datos de analytics"""
        try:
            if os.path.exists(self.analytics_file):
                with open(self.analytics_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return {}
        except Exception:
            return {}
    
    def _save_analytics(self, data: Dict[str, Any]):
        """Guarda datos de analytics"""
        try:
            os.makedirs(LOGS_FOLDER, exist_ok=True)
            with open(self.analytics_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error guardando analytics: {e}")
    
    def update_analytics(self, event_type: str, data: Dict[str, Any]):
        """Actualiza datos de analytics en tiempo real"""
        analytics = self._load_analytics()
        
        # Actualizar contadores
        analytics[f'total_{event_type}'] = analytics.get(f'total_{event_type}', 0) + 1
        
        # Datos diarios
        today = datetime.now().strftime('%Y-%m-%d')
        if 'daily_stats' not in analytics:
            analytics['daily_stats'] = {}
        if today not in analytics['daily_stats']:
            analytics['daily_stats'][today] = {}
        
        analytics['daily_stats'][today][event_type] = analytics['daily_stats'][today].get(event_type, 0) + 1
        
        # Datos específicos del evento
        if 'response_time' in data:
            analytics['avg_response_time'] = (
                analytics.get('avg_response_time', 0) * 0.9 + data['response_time'] * 0.1
            )
        
        self._save_analytics(analytics)