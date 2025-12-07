import os
import json

SOURCE_DIR = "services/jarvis-service/data/templates"
OUTPUT_FILE = "packages/db/templates/seed_data.json"

def main():
    if not os.path.exists(SOURCE_DIR):
        print(f"Error: {SOURCE_DIR} not found.")
        return

    templates = []
    
    # Existing 4 manual templates (preserve them)
    manual_templates = [
      {
        "name": "Demanda Ejecutiva",
        "category": "Civil",
        "type": "DEMANDA",
        "storagePath": "templates/demanda_ejecutiva.docx",
        "description": "Plantilla base para demandas ejecutivas de cobro de pesos."
      },
      {
        "name": "Contestación de Demanda",
        "category": "Civil",
        "type": "ESCRITO",
        "storagePath": "templates/contestacion_demanda.docx",
        "description": "Formato estándar para contestar demandas civiles."
      },
      {
        "name": "Escrito Téngase Presente",
        "category": "Tramitación",
        "type": "ESCRITO",
        "storagePath": "templates/tengase_presente.docx",
        "description": "Escrito simple para informar cambio de patrocinio o datos."
      },
      {
        "name": "Mandato Judicial",
        "category": "Administrativo",
        "type": "CONTRATO",
        "storagePath": "templates/mandato_judicial.docx",
        "description": "Contrato de mandato judicial amplio."
      }
    ]
    templates.extend(manual_templates)

    # Scan PDFs
    for filename in os.listdir(SOURCE_DIR):
        if filename.endswith(".pdf") or filename.endswith(".docx"):
            # Clean filename for name
            name = filename.replace("-", " ").replace(".pdf", "").replace(".docx", "")
            
            # Simple Category Logic
            category = "Doctrina"
            type_ = "OTRO"
            
            if "Civil" in name:
                category = "Civil"
            elif "Penal" in name:
                category = "Penal"
            elif "Laboral" in name:
                category = "Laboral"
            elif "Contrato" in name:
                type_ = "CONTRATO"
                category = "Civil"
            
            templates.append({
                "name": name,
                "category": category,
                "type": type_,
                "storagePath": f"templates/{filename}", # Relative to storage root (mock) or jarvis path?
                # Note: storagePath here is symbolic for DocWorks. 
                # DocWorks expects standard templates. These are Books.
                # User said: "Carga los reales conforme a la indexación... de los 24 libros que usamos para obtener plantillas"
                # This implies these ARE the templates or source of them.
                "description": f"Recurso jurídico: {name}"
            })

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(templates, f, indent=2, ensure_ascii=False)
        
    print(f"Generated {len(templates)} templates in {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
