from typing import Dict, Any, List
from .knowledge_base import knowledge_base
from ..ai.gemini_client import GeminiClient

gemini_client = GeminiClient()


class RAGSystem:
    def __init__(self):
        self.kb = knowledge_base

    def answer_question(self, question: str, extra_context: str | None = None) -> Dict[str, Any]:
        # 1) Buscar en KB
        kb_results = self.kb.search(question, collection_name="libros")

        # 2) Si hay contexto adicional (p.ej. resumen de causa Leximetrics), lo añadimos como pseudo-documento
        context_chunks: List[Dict[str, Any]] = list(kb_results)
        if extra_context:
            context_chunks.insert(
                0,
                {
                    "document": extra_context,
                    "metadata": {
                        "source_name": "Contexto de la Causa (Leximetrics)",
                        "score": 99.0,
                    },
                },
            )

        # 3) Llamamos a Gemini con estos chunks
        gemini_result = gemini_client.generate_answer(question, context_chunks)

        # 4) Construimos estructura para el frontend (fuentes con relevancia)
        sources = []
        for idx, item in enumerate(kb_results, start=1):
            meta = item.get("metadata", {}) or {}
            sources.append(
                {
                    "id": idx,
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
