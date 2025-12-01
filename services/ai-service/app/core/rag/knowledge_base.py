import logging
import chromadb
from chromadb.config import Settings as ChromaSettings
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Literal, Optional
from app.config import settings

logger = logging.getLogger(__name__)

KBCollectionName = Literal["practica_forense", "libros", "jurisprudencia", "legislacion", "doctrina", "external_cache"]
EXTERNAL_CACHE_COLLECTION = "external_cache"

class KnowledgeBase:
    """
    Gestor central de la base de conocimiento usando ChromaDB y SentenceTransformers.
    """
    def __init__(self):
        logger.info(f"Initializing KnowledgeBase at {settings.CHROMA_PERSIST_DIR}")
        self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        # Initialize embedding model (lazy load might be better for startup speed, but eager is safer for readiness)
        self.embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)

    def get_collection(self, name: KBCollectionName):
        """Obtiene o crea una colección."""
        return self.client.get_or_create_collection(
            name=name,
            metadata={"source": name} # Chroma metadata for the collection itself
        )

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Genera embeddings para una lista de textos."""
        embeddings = self.embedding_model.encode(texts)
        return embeddings.tolist()

    def add_documents(self, collection_name: KBCollectionName, ids: List[str], texts: List[str], metadatas: List[Dict]):
        """Añade documentos a una colección."""
        if not ids:
            return
            
        collection = self.get_collection(collection_name)
        embeddings = self.embed_texts(texts)
        
        collection.upsert(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas
        )
        logger.info(f"Added/Upserted {len(ids)} documents to {collection_name}")

    def search(self, collection_name: KBCollectionName, query: str, top_k: Optional[int] = None) -> List[Dict]:
        """
        Busca en una colección por similitud semántica.
        """
        k = top_k or settings.TOP_K_RESULTS
        collection = self.get_collection(collection_name)
        
        query_embedding = self.embed_texts([query])[0]
        
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=k
        )
        
        # Normalize results
        # Chroma returns lists of lists (one per query). We only have 1 query.
        normalized_results = []
        
        if not results["ids"]:
            return []
            
        ids = results["ids"][0]
        documents = results["documents"][0]
        metadatas = results["metadatas"][0]
        distances = results["distances"][0] if results["distances"] else [0.0] * len(ids)
        
        for i, doc_id in enumerate(ids):
            normalized_results.append({
                "id": doc_id,
                "document": documents[i],
                "metadata": metadatas[i],
                "score": 1.0 - distances[i] # Convert distance to similarity score approx
            })
            
        return normalized_results

    def get_collection_count(self, name: str) -> int:
        try:
            col = self.client.get_collection(name)
            return col.count()
        except Exception:
            return 0

knowledge_base = KnowledgeBase()
