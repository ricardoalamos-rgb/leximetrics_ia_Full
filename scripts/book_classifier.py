import json
import re

INPUT_FILE = "packages/db/templates/master_index.json"
OUTPUT_FILE = "packages/db/templates/real_templates_seed.json"

CATEGORIES = {
    "Civil": ["Civil", "Ejecutivo", "Ordinario", "Sumario", "Arrendamiento", "Precario", "Indemnización"],
    "Penal": ["Penal", "Querella", "Acusación", "Fiscalía", "Garantía", "Detención", "Prisión"],
    "Laboral": ["Laboral", "Despido", "Tutela", "Trabajador", "Empleador", "Sindicato"],
    "Familia": ["Familia", "Divorcio", "Alimentos", "Cuidado Personal", "VIF"],
    "Administrativo": ["Administrativo", "Municipal", "Contraloría", "Pública"],
    "Comercial": ["Sociedad", "EIRL", "SpA", "Junta", "Accionistas", "Quiebra", "Concursal"]
}

TYPES = {
    "DEMANDA": ["Demanda", "Querella", "Denuncia", "Reclamo", "Solicitud de Inicio"],
    "CONTRATO": ["Contrato", "Mandato", "Escritura", "Acuerdo", "Convenio", "Estatuto"],
    "RESOLUCION": ["Resolución", "Sentencia", "Auto", "Decreto"],
    "ESCRITO": ["Escrito", "Solicitud", "Téngase", "Acompaña", "Evacua", "Contestación", "Recurso", "Apelación", "Casación"]
}

def classify_title(title):
    title_lower = title.lower()
    
    # 1. Determine Category
    category = "General"
    for cat, keywords in CATEGORIES.items():
        for kw in keywords:
            if kw.lower() in title_lower:
                category = cat
                break
        if category != "General":
            break
            
    # 2. Determine Type (Enum)
    doc_type = "OTRO"
    for dt, keywords in TYPES.items():
        for kw in keywords:
            if kw.lower() in title_lower:
                doc_type = dt
                break
        if doc_type != "OTRO":
            break
            
    return category, doc_type

def main():
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            raw_index = json.load(f)
    except FileNotFoundError:
        print("Master index not found. Run indexer first.")
        return

    seed_templates = []
    seen_names = set()

    print(f"Propcessing {len(raw_index)} raw items...")
    
    for item in raw_index:
        title = item['title']
        book = item['book']
        page = item['page']
        
        # Unique Name logic: Title + (Book Abbrev)
        # Avoid duplicate names in DB (unique constraint)
        # Shorten book name
        book_short = book.split('-')[1] if '-' in book else book[:10]
        unique_name = f"{title} [{book_short}:{page}]"
        
        if unique_name in seen_names:
            continue
        seen_names.add(unique_name)

        cat, dtype = classify_title(title)
        
        # Storage Path Logic for "On-Demand":
        # We store the POINTER to the PDF page.
        # Format: "books/[FILENAME]#page=[PAGE]"
        storage_path = f"books/{book}#page={page}"
        
        seed_templates.append({
            "name": unique_name[:100], # Trucate if too long (Prisma limit?)
            "category": cat,
            "type": dtype,
            "storagePath": storage_path,
            "description": f"Modelo extraído de {book}, Pág {page}. Contexto: {item.get('raw_match', '')[:50]}..."
        })

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(seed_templates, f, indent=2, ensure_ascii=False)
        
    print(f"✅ Classification Complete.")
    print(f"Generated {len(seed_templates)} seedable templates in {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
