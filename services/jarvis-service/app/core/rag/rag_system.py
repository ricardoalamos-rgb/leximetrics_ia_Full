from typing import Dict, Any, List
from .knowledge_base import knowledge_base
from ..ai.gemini_client import GeminiClient
from .scielo_scraper import scielo_scraper

gemini_client = GeminiClient()


class RAGSystem:
    def __init__(self):
        self.kb = knowledge_base
        self.scielo = scielo_scraper

    def answer_question(self, question: str, extra_context: str | None = None) -> Dict[str, Any]:
        # 1) Buscar en KB Local (ChromaDB)
        kb_results = self.kb.search(question, collection_name="libros", limit=3)
        # kb_results = []
        
        # 2) Buscar en SciELO (Web Scraper)
        scielo_results = self.scielo.search(question, limit=3)
        
        # Convertir resultados de SciELO a formato chunk para el LLM
        scielo_chunks = []
        for res in scielo_results:
            scielo_chunks.append({
                "document": res["content"],
                "metadata": {
                    "source_name": "SciELO",
                    "title": res["title"],
                    "url": res["url"],
                    "score": 90.0
                }
            })

        # 3) Combinar contextos
        # Prioridad: Extra Context > SciELO > KB Local
        context_chunks: List[Dict[str, Any]] = list(kb_results)
        
        # Insertar SciELO al principio (son más frescos/relevantes si buscó eso)
        for chunk in reversed(scielo_chunks):
            context_chunks.insert(0, chunk)

        # Insertar Contexto de Causa (si existe) como máxima prioridad
        if extra_context:
            context_chunks.insert(
                0,
                {
                    "document": extra_context,
                    "metadata": {
                        "source_name": "Contexto de la Causa (Leximetrics)",
                        "score": 100.0,
                    },
                },
            )

        # 4) Llamamos a Gemini con estos chunks
        gemini_result = gemini_client.generate_answer(question, context_chunks)

        # 5) Construimos estructura para el frontend (fuentes con relevancia)
        sources = []
        
        # Fuentes de SciELO
        for idx, item in enumerate(scielo_results, start=1):
             sources.append({
                "id": f"scielo-{idx}",
                "source_name": "SciELO: " + item["title"],
                "score": 90,
                "excerpt": item["content"],
                "url": item["url"],
                "metadata": {"type": "web"}
            })

        # Fuentes de KB
        for idx, item in enumerate(kb_results, start=1):
            meta = item.get("metadata", {}) or {}
            sources.append(
                {
                    "id": f"kb-{idx}",
                    "source_name": meta.get("source_name")
                    or meta.get("title")
                    or meta.get("source")
                    or f"Documento {idx}",
                    "score": meta.get("score"),
                    "excerpt": (item.get("document") or "")[:400],
                    "metadata": meta,
                }
            )

        return {
            "answer": gemini_result["answer"],
            "sources": sources,
            "raw_model": gemini_result["raw"],
        }


rag_system = RAGSystem()
