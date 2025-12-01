import logging
import os
import time
import asyncio
import json
from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Tuple

from openai import OpenAI

from app.config import settings
from app.core.rag.rag_system import rag_system
from app.services.tts_service import tts_service
from app.services.telemetry import telemetry_logger as jarvis_telemetry
from app.telemetry import compute_cost_usd, log_ai_usage

# Configuración de Logging
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

app = FastAPI(title="JARVIS Backend", version="4.0")

# OpenAI Client for DocWorks
openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Files (Audio)
os.makedirs("audio_cache", exist_ok=True)
app.mount("/audio", StaticFiles(directory="audio_cache"), name="audio")

# --- Models ---
class AskRequest(BaseModel):
    question: str

class AskResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    correlation_id: str
    audio_url: Optional[str] = None

class TTSRequest(BaseModel):
    text: str
    correlation_id: Optional[str] = None

class FeedbackRequest(BaseModel):
    correlation_id: str
    is_helpful: bool
    comment: Optional[str] = None

class AnalysisResult(BaseModel):
    extracted_text_length: int
    placeholders_found: Dict[str, Optional[str]]

# --- Helper Functions ---

def extract_text_from_pdf(file_buffer: bytes) -> str:
    # Placeholder for PDF extraction
    # In a real implementation, use pdfplumber or similar
    return "Texto extraído del PDF (Simulado)"

def analyze_text_with_llm(text: str, required_placeholders: List[str]) -> Tuple[Dict[str, str | None], Dict]:
    if not text.strip():
        return {}, {}

    system_prompt = f"Analiza el siguiente documento legal y extrae: {', '.join(required_placeholders)}."

    try:
        start = time.perf_counter()
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"DOCUMENTO A ANALIZAR:\n\n{text[:15000]}"},
            ],
            temperature=0.1,
        )
        elapsed_ms = int((time.perf_counter() - start) * 1000)

        result_json = response.choices[0].message.content
        data = json.loads(result_json)

        usage = {
            "prompt_tokens": getattr(response, "usage", None).prompt_tokens if getattr(response, "usage", None) else 0,
            "completion_tokens": getattr(response, "usage", None).completion_tokens if getattr(response, "usage", None) else 0,
            "total_tokens": getattr(response, "usage", None).total_tokens if getattr(response, "usage", None) else 0,
            "latency_ms": elapsed_ms,
        }

        return data, usage

    except Exception as e:
        logger.error(f"Error during LLM analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error during AI analysis.")

# --- Endpoints ---

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "version": "4.0",
        "tts_enabled": settings.TTS_ENABLED,
        "telemetry_enabled": settings.TELEMETRY_ENABLED
    }

@app.post("/ask", response_model=AskResponse)
async def ask_jarvis(req: AskRequest):
    try:
        result = await rag_system.answer(req.question)
        return AskResponse(
            answer=result["answer"],
            sources=result["sources"],
            correlation_id=result["correlation_id"]
        )
    except Exception as e:
        logger.error(f"Error in /ask: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tts")
def generate_tts(req: TTSRequest):
    if not settings.TTS_ENABLED:
        raise HTTPException(status_code=400, detail="TTS is disabled")
    
    if not req.text:
        raise HTTPException(status_code=400, detail="Text is required")
        
    try:
        result = tts_service.synthesize(req.text)
        return {
            "audio_url": f"/audio/{result['filename']}",
            "filename": result["filename"]
        }
    except Exception as e:
        logger.error(f"Error in /tts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/telemetry/feedback")
def submit_feedback(req: FeedbackRequest):
    if not settings.TELEMETRY_ENABLED:
        raise HTTPException(status_code=400, detail="Telemetry is disabled")
        
    try:
        jarvis_telemetry.log_feedback(req.correlation_id, req.is_helpful)
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error in /telemetry/feedback: {e}")
        raise HTTPException(status_code=500, detail="Error logging feedback")

@app.post("/analyze-document", response_model=AnalysisResult)
async def analyze_document(
    file: UploadFile = File(...),
    placeholders: str = Form(...),
    tenant_id: str = Form(default="system"),
    user_id: str | None = Form(default=None),
):
    try:
        file_buffer = await file.read()
        extracted_text = extract_text_from_pdf(file_buffer)
        
        required_placeholders = json.loads(placeholders) if placeholders else []
        
        placeholders_found, usage = analyze_text_with_llm(extracted_text, required_placeholders)

        # Telemetría IA
        try:
            prompt_tokens = usage.get("prompt_tokens", 0)
            completion_tokens = usage.get("completion_tokens", 0)
            total_tokens = usage.get("total_tokens", 0)
            latency_ms = usage.get("latency_ms")

            cost_usd = compute_cost_usd(
                provider="openai",
                model="gpt-4o",
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
            )

            asyncio.create_task(
                log_ai_usage(
                    tenant_id=tenant_id,
                    user_id=user_id,
                    feature="DOCWORKS_ANALYZE",
                    provider="openai",
                    model="gpt-4o",
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    total_tokens=total_tokens,
                    cost_usd=cost_usd,
                    latency_ms=latency_ms,
                    correlation_id=None,
                    source="ai-service",
                    metadata={"endpoint": "/analyze-document"},
                )
            )
        except Exception as e:
            logger.error(f"Error scheduling telemetry task: {e}", exc_info=True)

        return AnalysisResult(
            extracted_text_length=len(extracted_text),
            placeholders_found=placeholders_found,
        )
    except Exception as e:
        logger.error(f"Error in /analyze-document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
