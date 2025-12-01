import sqlite3
from pathlib import Path
import json
import time
import math

DB_PATH = Path(__file__).resolve().parent.parent / "jarvis_telemetry.db"
MODEL_PATH = Path(__file__).resolve().parent / "exports" / "source_ranker.json"

def logistic_to_weight(coeff):
    # Mapea coeficientes alrededor de 0 → pesos en [0.5, 2.0]
    # esto se puede ajustar experimentalmente
    base = 1.0 + math.tanh(coeff)  # rango ~[0,2]
    return 0.5 + base  # ~[0.5, 2.5]

def main():
    if not MODEL_PATH.exists():
        print(f"Model not found at {MODEL_PATH}")
        return

    data = json.loads(MODEL_PATH.read_text(encoding="utf-8"))
    coeffs = data["coeffs"]

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    now = int(time.time())

    for stype, coeff in coeffs.items():
        w = logistic_to_weight(coeff)
        cur.execute(
            """
            INSERT INTO source_weight (source_type, weight, updated_at, total_positive, total_negative)
            VALUES (?, ?, ?, 0, 0)
            ON CONFLICT(source_type) DO UPDATE SET
              weight = excluded.weight,
              updated_at = excluded.updated_at
            """,
            (stype, w, now),
        )

    conn.commit()
    conn.close()
    print("Source weights updated from model.")

if __name__ == "__main__":
    main()
