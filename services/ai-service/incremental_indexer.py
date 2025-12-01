import json
import logging
import time
from pathlib import Path
from typing import List, Dict
import pdfplumber
from app.core.rag.knowledge_base import knowledge_base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PROGRESS_FILE = Path("indexing_progress.json")
LIBRARY_FILE = Path("library_books.json")

def load_progress() -> Dict:
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, "r") as f:
            return json.load(f)
    return {"processed_book_ids": [], "failed_book_ids": [], "last_run_at": None}

def save_progress(progress: Dict):
    progress["last_run_at"] = time.ctime()
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f, indent=2)

def load_library() -> List[Dict]:
    if LIBRARY_FILE.exists():
        with open(LIBRARY_FILE, "r") as f:
            return json.load(f)
    return [] # Retornar lista vacía si no existe

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += (chunk_size - overlap)
    return chunks

def extract_text_from_pdf(path: str) -> str:
    text = ""
    try:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
    except Exception as e:
        logger.error(f"Error reading PDF {path}: {e}")
        raise e
    return text

def main():
    progress = load_progress()
    books = load_library()
    
    processed_count = 0
    failed_count = 0
    
    for book in books:
        book_id = book["id"]
        
        if book_id in progress["processed_book_ids"]:
            continue
            
        logger.info(f"Indexing book: {book['title']} ({book_id})")
        
        try:
            # Asumimos que path es relativo o absoluto válido
            full_text = extract_text_from_pdf(book["path"])
            chunks = chunk_text(full_text)
            
            ids = [f"{book_id}_{i}" for i in range(len(chunks))]
            metadatas = [{
                "title": book["title"],
                "author": book["author"],
                "year": book["year"],
                "source_type": "libro",
                "category": book.get("category", "general"),
                "doc_id": book_id
            } for i in range(len(chunks))]
            
            knowledge_base.add_documents("libros", ids, chunks, metadatas)
            
            progress["processed_book_ids"].append(book_id)
            processed_count += 1
            save_progress(progress)
            
            # Sleep to be nice to CPU
            time.sleep(1)
            
        except Exception as e:
            logger.error(f"Failed to index {book_id}: {e}")
            progress["failed_book_ids"].append({"id": book_id, "error": str(e)})
            failed_count += 1
            save_progress(progress)

    logger.info(f"Indexing complete. Processed: {processed_count}, Failed: {failed_count}")

if __name__ == "__main__":
    main()
