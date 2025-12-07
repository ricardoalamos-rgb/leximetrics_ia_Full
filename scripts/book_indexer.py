import os
import re
import json
import PyPDF2
from tqdm import tqdm

SOURCE_DIR = "services/jarvis-service/data/templates"
OUTPUT_FILE = "packages/db/templates/master_index.json"

# Regex patterns to identify Template Headers
# Based on probe: "SERIE Nº 0107 - 1 : CERTIFICADO..."
PATTERNS = [
    r"SERIE\s*N[º°o]\s*[\d\-\s]+\s*:\s*(.+)",  # Matches "SERIE Nº 0107 - 1 : TITULO"
    r"^MODELO\s*(?:N[º°o])?\s*\d+[:\.\-]\s*(.+)",  # Matches "MODELO XX: TITULO"
    r"^(?:ESCRITO|FORMULARIO)\s*[\d\.]+\s*[:\-]\s*(.+)",
    r"^([A-ZÁÉÍÓÚÑ\s\.\(\)]{10,})$" # Catch-all for ALL CAPS lines (potential headers, risky but needs filtering)
]

def extract_titles_from_pdf(filepath, filename):
    found_templates = []
    try:
        reader = PyPDF2.PdfReader(filepath)
        total_pages = len(reader.pages)
        
        # Limit processing if too huge? No, user wants ALL.
        # But for speed in dev, maybe print progress.
        
        for i, page in enumerate(reader.pages):
            try:
                text = page.extract_text()
                if not text:
                    continue
                
                lines = text.split('\n')
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    
                    # Check regex
                    match = None
                    for pat in PATTERNS:
                        m = re.match(pat, line)
                        if m:
                            # If it's the ALL CAPS pattern, be stricter (must have > 3 words, not be generic words like "INDICE")
                            if pat.startswith("^([A-Z"): 
                                if len(line.split()) < 3 or "INDICE" in line or "CAPITULO" in line:
                                    continue
                                found_templates.append({
                                    "book": filename,
                                    "page": i + 1, # 1-based for humans
                                    "title": m.group(1).strip() if len(m.groups()) > 0 else line,
                                    "raw_match": line,
                                    "confidence": "low"
                                })
                                break # Found a match strategy, skip other regexes for this line
                            else:
                                found_templates.append({
                                    "book": filename,
                                    "page": i + 1,
                                    "title": m.group(1).strip(),
                                    "raw_match": line,
                                    "confidence": "high"
                                })
                                break
            except Exception as e_page:
                pass # Skip page on error
                
    except Exception as e:
        print(f"Error reading {filename}: {e}")
        
    return found_templates

def main():
    if not os.path.exists(SOURCE_DIR):
        print(f"Source dir {SOURCE_DIR} not found.")
        return

    all_templates = []
    
    files = [f for f in os.listdir(SOURCE_DIR) if f.lower().endswith('.pdf')]
    print(f"Found {len(files)} PDF books.")
    
    for filename in tqdm(files):
        path = os.path.join(SOURCE_DIR, filename)
        templates = extract_titles_from_pdf(path, filename)
        all_templates.extend(templates)
        print(f"  -> {filename}: Found {len(templates)} templates.")

    # Dedup? Some templates might span pages or appear in Index + Body.
    # For now, keep all.
    
    # Save Master Index
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_templates, f, indent=2, ensure_ascii=False)
        
    print(f"\n✅ Indexing Complete. Total templates found: {len(all_templates)}")
    print(f"Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
