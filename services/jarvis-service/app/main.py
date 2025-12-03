from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from .config import SERVICE_NAME, DEBUG
from .core.rag.rag_system import rag_system
import time

app = FastAPI(
    title=SERVICE_NAME,
    version="4.0.0",
    description="J.A.R.V.I.S. 4.0 - Asistente jurídico RAG (Gemini 2.0 Flash + Chroma)",
    debug=DEBUG,
)

# CORS básico
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Puedes restringir a dominios Leximetrics
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AskRequest(BaseModel):
    question: str
    extra_context: Optional[str] = None
    speak: bool = True  # si se desea TTS


class AskResponse(BaseModel):
    answer: str
    sources: list
    audioUrl: Optional[str] = None


class TTSRequest(BaseModel):
    text: str


class TTSResponse(BaseModel):
    audioUrl: str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "time": int(time.time()),
    }


@app.post("/ask", response_model=AskResponse)
def ask_jarvis(body: AskRequest):
    """
    Endpoint principal: RAG + Gemini.
    """
    try:
        rag_result = rag_system.answer_question(body.question, body.extra_context)

        return AskResponse(
            answer=rag_result["answer"],
            sources=rag_result["sources"],
            audioUrl=None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
