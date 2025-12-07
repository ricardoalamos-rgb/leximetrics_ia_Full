import os
import json
import re

TEMPLATES_DIR = "packages/db/templates"
OUTPUT_FILE = "packages/db/templates/seed_data.json"

def categorize_file(filename):
    lower_name = filename.lower()
    
    if "penal" in lower_name:
        return "Penal"
    if "laboral" in lower_name:
        return "Laboral"
    if "familia" in lower_name or "guardas" in lower_name:
        return "Familia"
    if "contratos" in lower_name:
        return "Civil"
    if "civil" in lower_name:
        return "Civil"
    if "sociedades" in lower_name or "comercial" in lower_name:
        return "Comercial"
    if "administrativo" in lower_name:
        return "Administrativo"
    if "constitucional" in lower_name:
        return "Constitucional"
    
    return "General"

def generate_json():
    templates = []
    
    if not os.path.exists(TEMPLATES_DIR):
        print(f"Error: Directory {TEMPLATES_DIR} not found.")
        return

    files = sorted(os.listdir(TEMPLATES_DIR))
    
    for f in files:
        if f.endswith(".json"): continue
        if f.startswith("."): continue
        
        category = categorize_file(f)
        
        # Clean up name for display
        display_name = f
        # Remove numbers at start
        display_name = re.sub(r'^\d+-', '', display_name)
        # Remove extension
        display_name = os.path.splitext(display_name)[0]
        # Replace hyphens/underscores
        display_name = display_name.replace('-', ' ').replace('_', ' ')
        
        # Determine type
        doc_type = "OTRO"
        if "demanda" in display_name.lower():
            doc_type = "DEMANDA"
        elif "contrato" in display_name.lower():
            doc_type = "CONTRATO"
        elif "escrito" in display_name.lower():
            doc_type = "ESCRITO"
            
        template_entry = {
            "name": display_name,
            "filename": f,
            "category": category,
            "type": doc_type,
            "description": f"Recurso importado: {display_name}",
            "storagePath": f"packages/db/templates/{f}" # Relative path in repo
        }
        templates.append(template_entry)

    with open(OUTPUT_FILE, 'w') as f:
        json.dump(templates, f, indent=2)
    
    print(f"✅ Generated {len(templates)} entries in {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_json()
