import sqlite3
from pathlib import Path
import csv
import json
from collections import defaultdict

DB_PATH = Path(__file__).resolve().parent.parent / "jarvis_telemetry.db"
OUT_DIR = Path(__file__).resolve().parent / "exports"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_CSV = OUT_DIR / "jarvis_training_data.csv"

def main():
    if not DB_PATH.exists():
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Join queries + feedback + fuentes
    cur.execute(
        """
        SELECT
          q.id AS rag_query_id,
          q.question,
          f.useful,
          GROUP_CONCAT(DISTINCT s.source_type) AS source_types
        FROM rag_query q
        JOIN rag_feedback f ON f.rag_query_id = q.id
        JOIN rag_source s ON s.rag_query_id = q.id
        GROUP BY q.id, q.question, f.useful
        """
    )

    rows = cur.fetchall()
    conn.close()

    with OUT_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["rag_query_id", "question", "useful", "source_types"])
        for r in rows:
            rag_query_id, question, useful, source_types = r
            writer.writerow([rag_query_id, question, useful, source_types])

    print(f"Exported {len(rows)} rows to {OUT_CSV}")

if __name__ == "__main__":
    main()
