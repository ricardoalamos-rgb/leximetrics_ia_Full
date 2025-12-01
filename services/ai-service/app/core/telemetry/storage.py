import sqlite3
import json
import logging
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)

DB_PATH = Path("jarvis_telemetry.db")

def init_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS telemetry_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                feature TEXT,
                action TEXT,
                duration_ms INTEGER,
                meta TEXT,
                error TEXT
            )
        """)
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Error initializing telemetry DB: {e}")

def save_event(event: dict):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        meta_json = json.dumps(event.get("meta", {}))
        
        cursor.execute("""
            INSERT INTO telemetry_events (timestamp, feature, action, duration_ms, meta, error)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            datetime.now().isoformat(),
            event.get("feature"),
            event.get("action"),
            event.get("durationMs"),
            meta_json,
            event.get("error")
        ))
        
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Error saving telemetry event: {e}")

def get_recent_events(limit=50):
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM telemetry_events ORDER BY id DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        logger.error(f"Error fetching telemetry events: {e}")
        return []

def get_source_usage_stats():
    """
    Aggregates usage stats by source from telemetry_events.
    Returns list of { source_type, count, avg_relevance }
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # We look for events with action='rag_source_used'
        # meta should contain 'source' and 'relevance'
        cursor.execute("SELECT meta FROM telemetry_events WHERE action = 'rag_source_used'")
        rows = cursor.fetchall()
        conn.close()

        stats = {}
        for row in rows:
            try:
                meta = json.loads(row['meta'])
                source = meta.get('source', 'UNKNOWN')
                relevance = meta.get('relevance', 0.0)
                
                if source not in stats:
                    stats[source] = {'count': 0, 'total_relevance': 0.0}
                
                stats[source]['count'] += 1
                stats[source]['total_relevance'] += relevance
            except:
                continue

        result = []
        for source, data in stats.items():
            avg = (data['total_relevance'] / data['count']) * 100 if data['count'] > 0 else 0
            result.append({
                "source_type": source,
                "count": data['count'],
                "avg_relevance": round(avg, 1)
            })
            
        return result
    except Exception as e:
        logger.error(f"Error fetching source stats: {e}")
        return []
