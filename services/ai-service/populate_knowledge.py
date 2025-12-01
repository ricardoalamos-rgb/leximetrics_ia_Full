import logging
import os
from pathlib import Path
from typing import List
# Note: PyPDF2 or pdfplumber needed. Requirements has pdfplumber.
import pdfplumber
from app.core.rag.knowledge_base import knowledge_base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Config
DOCS_DIR = Path("documents/manuales") # Ajustar según estructura real

INITIAL_DOCS = [
    {"id": "man_01", "filename": "manual_procesal.pdf", "title": "Manual de Derecho Procesal", "author": "Autor X", "year": 2023, "category": "practica_forense"},
    {"id": "man_02", "filename": "manual_civil.pdf", "title": "Manual de Derecho Civil", "author": "Autor Y", "year": 2022, "category": "practica_forense"},
    # ... más docs
]

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += (chunk_size - overlap)
    return chunks

def extract_text_from_pdf(path: Path) -> str:
    text = ""
    try:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
    except Exception as e:
        logger.error(f"Error reading PDF {path}: {e}")
    return text

def main():
    logger.info("Starting initial knowledge population...")
    
    for doc in INITIAL_DOCS:
        path = DOCS_DIR / doc["filename"]
        if not path.exists():
            logger.warning(f"File not found: {path}, skipping.")
            continue
            
        logger.info(f"Processing {doc['title']}...")
        full_text = extract_text_from_pdf(path)
        
        if not full_text:
            logger.warning(f"No text extracted from {path}")
            continue
            
        chunks = chunk_text(full_text)
        
        ids = [f"{doc['id']}_chunk_{i}" for i in range(len(chunks))]
        metadatas = []
        for i in range(len(chunks)):
            meta = {
                "title": doc["title"],
                "author": doc["author"],
                "year": doc["year"],
                "source_type": "libro", # o practica_forense
                "doc_id": doc["id"],
                "chunk_index": i
            }
            metadatas.append(meta)
            
        knowledge_base.add_documents("practica_forense", ids, chunks, metadatas)
        logger.info(f"Indexed {len(chunks)} chunks for {doc['title']}")

if __name__ == "__main__":
    main()
