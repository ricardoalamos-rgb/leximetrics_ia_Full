from typing import List, Dict, Any
# from sentence_transformers import SentenceTransformer
# import chromadb
# from chromadb.utils import embedding_functions
from app.config import CHROMA_PERSIST_DIR, EMBEDDING_MODEL_NAME, TOP_K_RESULTS

# Cargamos modelo de embeddings una sola vez
# _sentence_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
# embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
#     model_name=EMBEDDING_MODEL_NAME
# )

# chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
chroma_client = None

DEFAULT_COLLECTION = "libros"  # Puedes cambiarlo o hacer múltiple colección


class KnowledgeBase:
    def __init__(self):
        self.client = chroma_client
        self.default_collection = self._get_or_create_collection(DEFAULT_COLLECTION)

    def _get_or_create_collection(self, name: str):
        try:
            return self.client.get_collection(name=name)
        except Exception:
            return self.client.create_collection(name=name, embedding_function=embedding_fn)

    def search(
        self,
        query: str,
        collection_name: str = DEFAULT_COLLECTION,
        top_k: int = TOP_K_RESULTS,
    ) -> List[Dict[str, Any]]:
        collection = self._get_or_create_collection(collection_name)
        results = collection.query(
            query_texts=[query],
            n_results=top_k,
            include=["documents", "metadatas", "distances"],
        )

        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        dists = results.get("distances", [[]])[0]

        out: List[Dict[str, Any]] = []
        for doc, meta, dist in zip(docs, metas, dists):
            # Convertimos distancia coseno a % relevancia aprox.
            relevance = (1 - dist / 2) * 100 if isinstance(dist, (int, float)) else None
            meta = meta or {}
            if relevance is not None:
                meta["score"] = relevance
            out.append({"document": doc, "metadata": meta, "distance": dist})
        return out

    def add_document(
        self,
        collection_name: str,
        document: str,
        metadata: Dict[str, Any],
        doc_id: str,
    ):
        collection = self._get_or_create_collection(collection_name)
        collection.add(documents=[document], metadatas=[metadata], ids=[doc_id])


knowledge_base = KnowledgeBase()
