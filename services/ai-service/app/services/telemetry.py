import sqlite3
import logging
import json
from typing import List, Dict, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class TelemetryLogger:
    _instance = None

    @classmethod
    def instance(cls):
        if cls._instance is None:
            cls._instance = TelemetryLogger()
        return cls._instance

    def __init__(self, enabled: bool = True):
        self.enabled = enabled and settings.TELEMETRY_ENABLED
        self.db_path = settings.TELEMETRY_DB_PATH
        if self.enabled:
            self._init_db()

    def _init_db(self):
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Tabla de pesos por fuente
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS source_weight (
                        source_name TEXT PRIMARY KEY,
                        weight REAL NOT NULL DEFAULT 1.0
                    )
                """)
                
                # Tabla de eventos RAG (Query + Respuesta)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS rag_event (
                        correlation_id TEXT PRIMARY KEY,
                        question TEXT,
                        answer TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Tabla de fuentes usadas en un evento
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS rag_event_source (
                        correlation_id TEXT,
                        source_name TEXT,
                        raw_score REAL,
                        adjusted_score REAL,
                        rank INTEGER,
                        FOREIGN KEY(correlation_id) REFERENCES rag_event(correlation_id)
                    )
                """)
                
                # Tabla de feedback
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS rag_feedback (
                        correlation_id TEXT,
                        is_helpful INTEGER,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY(correlation_id) REFERENCES rag_event(correlation_id)
                    )
                """)
                
                # Tablas legacy o adicionales (rag_query, rag_source) pueden coexistir si se necesitan,
                # pero aquí seguimos el esquema J-10.
                
                conn.commit()
        except Exception as e:
            logger.error(f"Error initializing telemetry DB: {e}")

    def log_rag_answer(self, correlation_id: str, question: str, sources: List[Dict], answer: str):
        if not self.enabled:
            return
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO rag_event (correlation_id, question, answer) VALUES (?, ?, ?)",
                    (correlation_id, question, answer)
                )
                
                for i, src in enumerate(sources):
                    cursor.execute(
                        "INSERT INTO rag_event_source (correlation_id, source_name, raw_score, adjusted_score, rank) VALUES (?, ?, ?, ?, ?)",
                        (
                            correlation_id,
                            src.get("source_type", "unknown"),
                            src.get("score", 0.0),
                            src.get("adjusted_score", 0.0),
                            i + 1
                        )
                    )
                conn.commit()
        except Exception as e:
            logger.error(f"Error logging RAG answer: {e}")

    def log_feedback(self, correlation_id: str, is_helpful: bool):
        if not self.enabled:
            return
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO rag_feedback (correlation_id, is_helpful) VALUES (?, ?)",
                    (correlation_id, 1 if is_helpful else 0)
                )
                conn.commit()
        except Exception as e:
            logger.error(f"Error logging feedback: {e}")

    def get_source_weights(self, default: float = 1.0, area: Optional[str] = None) -> Dict[str, float]:
        # area support is optional/advanced, sticking to J-10 basic requirements first
        if not self.enabled:
            return {}
        try:
            weights = {}
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT source_name, weight FROM source_weight")
                for row in cursor.fetchall():
                    weights[row[0]] = row[1]
            return weights
        except Exception as e:
            logger.error(f"Error getting source weights: {e}")
            return {}

    # Compatibility methods for existing code if needed
    def get_area_for_query(self, query_id):
        return None 
        
    def log_sources_for_query(self, query_id, sources):
        pass

telemetry_logger = TelemetryLogger()
