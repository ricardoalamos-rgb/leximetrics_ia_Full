import os
import time
import logging
from typing import List, Dict, Optional
from app.core.rag.knowledge_base import KnowledgeBase, EXTERNAL_CACHE_COLLECTION

logger = logging.getLogger(__name__)

class ExternalSearchCache:
    def __init__(self, kb: KnowledgeBase, ttl_days: int | None = None):
        self.kb = kb
        self.ttl_seconds = (ttl_days or int(os.environ.get("EXTERNAL_CACHE_TTL_DAYS", 7))) * 86400
        self.collection = EXTERNAL_CACHE_COLLECTION

    def get(self, query: str, source: str) -> List[Dict]:
        """
        Retrieve cached results for a query and source.
        Checks TTL.
        """
        try:
            # Search in cache collection using the query text
            # We assume the 'document' field in cache stores the query or a representation of it,
            # OR we rely on semantic similarity of the query to cached queries.
            # However, exact match on query string is safer for a cache.
            # Since Chroma is vector store, we search by vector.
            # To do exact match, we would need metadata filtering on 'query_text'.
            # Assuming we store 'query_text' in metadata.
            
            # Note: KnowledgeBase.search returns list of dicts with 'metadata' and 'document'.
            # We need to filter by source and query_text if possible, or just rely on similarity.
            # For a strict cache, we want exact query match.
            # But KnowledgeBase.search is semantic.
            # Let's try to filter by metadata if KB supports it, otherwise post-filter.
            
            # Mocking metadata filter support in KB.search if it existed, but standard Chroma supports it.
            # We'll assume KB.search takes a filter dict if we modified it, but we didn't.
            # So we'll search top_k=10 and filter manually.
            
            results = self.kb.search(self.collection, query, top_k=20)
            
            valid_hits = []
            now = time.time()
            
            for res in results:
                meta = res.get("metadata", {})
                
                # Check source
                if meta.get("source_type") != source:
                    continue
                    
                # Check query match (optional, if we want strict cache)
                # If we want semantic cache, we skip this. Let's stick to semantic for RAG.
                # But prompt says "Buscar... por embedding de query o por clave textual".
                
                # Check TTL
                cached_at = meta.get("cached_at", 0)
                if now - cached_at > self.ttl_seconds:
                    continue
                    
                valid_hits.append(res)
                
            return valid_hits
            
        except Exception as e:
            logger.error(f"Error reading external cache: {e}")
            return []

    def set(self, query: str, source: str, results: List[Dict]) -> None:
        """
        Cache results.
        """
        if not results:
            return
            
        try:
            documents = []
            metadatas = []
            ids = []
            now = time.time()
            
            for i, res in enumerate(results):
                # Construct a document content representation
                # Could be the title + summary
                content = f"{res.get('titulo', '')} {res.get('resumen', '')} {res.get('caratulado', '')}"
                
                meta = res.copy()
                # Flatten metadata if needed (Chroma doesn't like nested dicts)
                # Ensure we add cache fields
                meta["source_type"] = source
                meta["cached_at"] = now
                meta["query_text"] = query
                
                # Clean metadata values to be strings/ints/floats
                clean_meta = {}
                for k, v in meta.items():
                    if isinstance(v, (str, int, float, bool)):
                        clean_meta[k] = v
                    elif v is None:
                        pass # Skip None
                    else:
                        clean_meta[k] = str(v) # Stringify lists/dicts
                
                documents.append(content)
                metadatas.append(clean_meta)
                ids.append(f"cache_{source}_{now}_{i}")
                
            self.kb.add_documents(self.collection, documents, metadatas, ids)
            
        except Exception as e:
            logger.error(f"Error writing to external cache: {e}")

if __name__ == "__main__":
    # Test simple
    from app.core.rag.knowledge_base import knowledge_base
    
    cache = ExternalSearchCache(knowledge_base)
    print("Testing ExternalSearchCache...")
    
    # Set
    cache.set("prueba", "pjud", [{"titulo": "Fallo prueba", "rol": "123-2024"}])
    
    # Get
    hits = cache.get("prueba", "pjud")
    print(f"Hits found: {len(hits)}")
