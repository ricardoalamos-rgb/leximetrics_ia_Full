import requests
from typing import List, Dict, Any
from app.config import GEMINI_API_KEY, GEMINI_MODEL_NAME

GEMINI_ENDPOINT = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL_NAME}:generateContent"
)


class GeminiClient:
    def __init__(self, api_key: str = GEMINI_API_KEY):
        self.api_key = api_key

    def generate_answer(
        self,
        question: str,
        context_chunks: List[Dict[str, Any]],
        temperature: float = 0.7,
        max_output_tokens: int = 1024,
    ) -> Dict[str, Any]:
        """
        Envía un prompt estructurado a Gemini con contexto (RAG).
        Devuelve un dict con `answer` (str) y `raw` (respuesta cruda).
        """
        context_text_parts = []
        for i, chunk in enumerate(context_chunks, start=1):
            meta = chunk.get("metadata", {})
            fuente = meta.get("source_name") or meta.get("source") or f"Fuente {i}"
            score = meta.get("score")
            score_txt = f" (relevancia {score:.1f}%)" if isinstance(score, (int, float)) else ""
            context_text_parts.append(
                f"[{i}] {fuente}{score_txt}\n{chunk.get('document', '')}\n"
            )

        context_text = "\n\n".join(context_text_parts) or "No se recuperó contexto relevante."

        system_prompt = (
            "Eres J.A.R.V.I.S., un asistente jurídico chileno experto. "
            "Responde en español claro, estructurado, citando las fuentes numéricas [1], [2] "
            "cuando corresponda. Si la pregunta está fuera del derecho chileno o no tienes "
            "información suficiente, dilo explícitamente."
        )

        user_prompt = (
            f"CONTEXTO JURÍDICO (puede contener extractos de libros, jurisprudencia, legislación y doctrina):\n"
            f"{context_text}\n\n"
            f"PREGUNTA DEL USUARIO:\n{question}\n\n"
            "Instrucciones:\n"
            "- Responde de forma breve pero sólida.\n"
            "- Usa viñetas cuando ayude a la claridad.\n"
            "- Menciona [n] al final de las frases relevantes según las fuentes usadas.\n"
        )

        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": system_prompt}]},
                {"role": "user", "parts": [{"text": user_prompt}]},
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_output_tokens,
            },
        }

        if not self.api_key:
            return {
                "answer": "⚠️ Error de Configuración: No se ha detectado la GEMINI_API_KEY en el entorno. Por favor configure la variable de entorno en Railway.",
                "raw": {"error": "Missing API Key"}
            }

        try:
            resp = requests.post(
                f"{GEMINI_ENDPOINT}?key={self.api_key}",
                json=payload,
                timeout=60,
            )
            resp.raise_for_status()
            data = resp.json()

            answer = (
                data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
                .strip()
            )

            return {"answer": answer, "raw": data}
        
        except Exception as e:
            print(f"Gemini API Error: {e}")
            return {
                "answer": f"Lo siento, ocurrió un error al consultar a mi cerebro (Gemini): {str(e)}",
                "raw": {"error": str(e)}
            }
