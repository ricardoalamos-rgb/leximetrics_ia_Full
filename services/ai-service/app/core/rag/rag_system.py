import logging
import uuid
from typing import Dict, Any, List
from app.core.ai.gemini_client import gemini_client
from app.core.rag.multi_source_search import multi_source_search
from app.services.telemetry import TelemetryLogger
from app.config import settings

logger = logging.getLogger(__name__)

class RAGSystem:
    """
    Orquestador principal del sistema RAG.
    Combina búsqueda multi-fuente, generación con LLM y telemetría.
    """
    def __init__(self):
        self.telemetry = TelemetryLogger.instance()

    async def answer(self, question: str) -> Dict[str, Any]:
        correlation_id = str(uuid.uuid4())
        logger.info(f"RAG Answer Start: {correlation_id} - Q: {question}")
        
        # 1. Búsqueda Multi-Fuente
        # Nota: multi_source_search ahora es async
        results = await multi_source_search(question, rag_query_id=None) # Pasamos None por ahora, o adaptamos multi_source_search para usar correlation_id string
        
        # Filtrar y ordenar top-k
        # multi_source_search ya devuelve ordenado por adjusted_score
        top_results = results[:settings.TOP_K_RESULTS]
        
        # 2. Construcción de Contexto
        context_parts = []
        for r in top_results:
            source = r.get("source_type", "unknown")
            score = r.get("adjusted_score", 0.0)
            content = r.get("document", "")[:500] # Truncar para no exceder ventana
            meta = r.get("metadata", {})
            
            # Formatear metadata relevante
            meta_str = ", ".join([f"{k}:{v}" for k, v in meta.items() if v and k not in ["document", "source_type"]])
            
            context_parts.append(f"FUENTE: {source} (score={score:.2f})\nMETADATA: {meta_str}\nCONTENIDO: {content}")
            
        context_text = "\n\n".join(context_parts)
        
        # 3. Prompt Engineering
        system_prompt = (
            "Eres J.A.R.V.I.S., un asistente legal experto en derecho chileno.\n"
            "Tu objetivo es responder la pregunta del usuario basándote EXCLUSIVAMENTE en el contexto proporcionado.\n"
            "REGLAS:\n"
            "1. Cita expresamente las fuentes (Rol, Ley, Artículo, Libro) cuando uses su información.\n"
            "2. Si el contexto no tiene información suficiente, dilo honestamente.\n"
            "3. Mantén un tono profesional, preciso y jurídico.\n"
            "4. Usa formato Markdown para estructurar tu respuesta.\n"
            f"\nCONTEXTO DISPONIBLE:\n{context_text}"
        )
        
        # 4. Generación
        try:
            answer_text = gemini_client.generate(system_prompt, question)
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            answer_text = "Lo siento, ocurrió un error al generar la respuesta."

        # 5. Telemetría
        if settings.TELEMETRY_ENABLED:
            # Adaptar log_rag_answer para aceptar correlation_id string
            # El TelemetryLogger actual usa int ID para queries. 
            # Vamos a necesitar ajustar TelemetryLogger para manejar correlation_id string o mapearlo.
            # Por simplicidad en este paso, asumimos que log_rag_answer maneja la persistencia.
            self.telemetry.log_rag_answer(correlation_id, question, top_results, answer_text)

        return {
            "answer": answer_text,
            "sources": top_results,
            "correlation_id": correlation_id
        }

rag_system = RAGSystem()
