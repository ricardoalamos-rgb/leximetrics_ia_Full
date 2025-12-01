import sqlite3
import logging
from collections import defaultdict
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def train_weights():
    db_path = settings.TELEMETRY_DB_PATH
    logger.info(f"Training source weights from {db_path}...")
    
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            
            # Obtener eventos con feedback
            # Join rag_event_source with rag_feedback
            query = """
                SELECT s.source_name, f.is_helpful
                FROM rag_event_source s
                JOIN rag_feedback f ON s.correlation_id = f.correlation_id
            """
            cursor.execute(query)
            rows = cursor.fetchall()
            
            if not rows:
                logger.warning("No feedback data found. Skipping training.")
                return

            score_deltas = defaultdict(float)
            
            for source_name, is_helpful in rows:
                # Algoritmo simple:
                # +1 si helpful, -1 si not helpful
                # Podríamos ponderar por rank (ej. si estaba rank 1 y fue helpful, +1.5)
                delta = 1.0 if is_helpful else -1.0
                score_deltas[source_name] += delta
                
            # Calcular nuevos pesos
            # Base weight = 1.0
            # New weight = clamp(0.5, 3.0, 1.0 + delta * 0.1)
            
            new_weights = {}
            for source, delta in score_deltas.items():
                w = 1.0 + (delta * 0.1)
                w = max(0.5, min(3.0, w))
                new_weights[source] = w
                
            logger.info(f"New weights calculated: {new_weights}")
            
            # Actualizar DB
            for source, weight in new_weights.items():
                cursor.execute(
                    "INSERT INTO source_weight (source_name, weight) VALUES (?, ?) ON CONFLICT(source_name) DO UPDATE SET weight=excluded.weight",
                    (source, weight)
                )
            
            conn.commit()
            logger.info("Source weights updated in DB.")
            
    except Exception as e:
        logger.error(f"Error training weights: {e}")

if __name__ == "__main__":
    train_weights()
