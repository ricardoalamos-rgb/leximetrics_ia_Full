import pandas as pd
import json
import os
import sys

# Configuration
EXCEL_PATH = "apps/web/public/templates/plantilla_carga_causas.xlsx"
OUTPUT_JSON_PATH = "packages/db/prisma/causas_seed.json"

def clean_excel():
    if not os.path.exists(EXCEL_PATH):
        print(f"Error: File not found at {EXCEL_PATH}")
        sys.exit(1)

    print(f"Reading {EXCEL_PATH}...")
    try:
        df = pd.read_excel(EXCEL_PATH)
    except Exception as e:
        print(f"Error reading Excel: {e}")
        # Try installing dependencies if missing (openpyxl)
        sys.exit(1)

    print(f"Columns found: {df.columns.tolist()}")
    print("Sample row:")
    print(df.head(1).to_dict())

    # Normalized columns
    df.columns = [c.lower().strip().replace(' ', '_') for c in df.columns]

    
    # Dynamic Mapping based on known headers
    map_cols = {}
    for c in df.columns:
        if 'rol' in c: map_cols['rol'] = c
        elif 'tribunal' in c: map_cols['tribunal'] = c
        elif 'rut' in c and 'deudor' in c: map_cols['rutDeudor'] = c
        elif 'nombre' in c and 'deudor' in c: map_cols['nombreDeudor'] = c
        elif 'monto' in c: map_cols['montoDemanda'] = c
        elif 'fecha' in c and 'ingreso' in c: map_cols['fechaIngreso'] = c
        # For Caratula, pick the one that seems most generic or check row values
        elif 'caratula' in c:
            # If multiple, we might overwrite, but usually there's one main one. 
            # In user sample, one specific column had data. 
            # Let's map all 'caratula' to 'caratula' but prioritizing the one with data later?
            # Or just map "Caratula (Ej: BANCO CHILE / GONZALEZ)" specifically if we can.
            # Let's try to map the one with 'banco' if possible, or just 'caratula'
            map_cols['caratula'] = c

    print(f"Mapping: {map_cols}")

    causas = []
    for _, row in df.iterrows():
        # Extractor helper
        def get_val(key):
            col_name = map_cols.get(key)
            if not col_name: return ''
            val = row.get(col_name)
            if pd.isna(val): return ''
            return str(val).strip()

        # Find caratula: Iterate all columns to find a non-empty caratula if map failed or ambiguous
        caratula_val = get_val('caratula')
        if not caratula_val:
            for c in df.columns:
                if 'caratula' in c:
                    val = row.get(c)
                    if not pd.isna(val):
                        caratula_val = str(val).strip()
                        break

        causa = {
            "rol": get_val('rol'),
            "tribunal": get_val('tribunal'),
            "caratula": caratula_val,
            "materia": "Civil",
            "rutDeudor": get_val('rutDeudor'),
            "nombreDeudor": get_val('nombreDeudor'),
            "montoDemanda": get_val('montoDemanda'),
            "fechaIngreso": get_val('fechaIngreso'),
            "estado": "TRAMITACION",
            "resumen": f"Deudor: {get_val('nombreDeudor') or 'N/A'}",
        }
        
        # Clean numeric
        try:
             if causa["montoDemanda"]: 
                 causa["montoDemanda"] = float(str(causa["montoDemanda"]).replace('$','').replace('.',''))
             else:
                 causa["montoDemanda"] = None
        except:
            causa["montoDemanda"] = None

        if causa["rol"]:
            causas.append(causa)

    print(f"Found {len(causas)} valid rows.")
    
    with open(OUTPUT_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(causas, f, indent=2, ensure_ascii=False)
    
    print(f"Generated {OUTPUT_JSON_PATH}")

if __name__ == "__main__":
    clean_excel()
