import pandas as pd
from pathlib import Path
from sklearn.linear_model import LogisticRegression
import json
import sys

BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = BASE_DIR / "exports" / "jarvis_training_data.csv"
MODEL_PATH = BASE_DIR / "exports" / "source_ranker.json"

def main():
    if not CSV_PATH.exists():
        print(f"CSV not found at {CSV_PATH}. Run export_telemetry_dataset.py first.")
        return

    try:
        df = pd.read_csv(CSV_PATH)
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    if df.empty:
        print("Dataset is empty.")
        return

    # Expandir source_types en columnas one-hot
    # p.ej. source_types = "PJUD,LIBRO" → cols: PJUD=1, LIBRO=1, BCN=0...
    all_sources = sorted(
        {
            st
            for types in df["source_types"].dropna()
            for st in str(types).split(",")
        }
    )

    if not all_sources:
        print("No sources found in dataset.")
        return

    def row_to_vector(types_str):
        types = set(str(types_str).split(",")) if pd.notna(types_str) else set()
        return [1 if s in types else 0 for s in all_sources]

    X = [row_to_vector(t) for t in df["source_types"]]
    y = df["useful"].astype(int).values

    if len(set(y)) < 2:
        print("Need both useful and not useful examples to train.")
        return

    model = LogisticRegression()
    model.fit(X, y)

    # Guardar coeficientes por fuente
    coeffs = dict(zip(all_sources, model.coef_[0].tolist()))
    bias = float(model.intercept_[0])

    MODEL_PATH.write_text(
        json.dumps({"sources": all_sources, "coeffs": coeffs, "bias": bias}, indent=2),
        encoding="utf-8",
    )

    print(f"Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    main()
