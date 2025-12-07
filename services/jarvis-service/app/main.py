from fastapi import FastAPI, HTTPException, UploadFile, File, Form
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
        print(f"❌ ERROR ASKING JARVIS: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-document")
async def analyze_document(
    file: UploadFile = File(...),
    placeholders: str = Form(...)
):
    try:
        import io
        import PyPDF2
        import json
        import re

        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        extracted_text_length = len(text)
        
        question = f"""
        Actúa como un asistente legal experto. Analiza el texto proporcionado (contexto) y extrae los valores para los siguientes campos (placeholders): {placeholders}.
        Responde DIRECTAMENTE con un objeto JSON válido donde las claves sean los nombres de los campos y los valores sean la información extraída.
        Si no encuentras información para un campo, usa una cadena vacía "".
        NO incluyas markdown, solo el JSON raw.
        """
        
        rag_result = rag_system.answer_question(question, extra_context=text)
        answer = rag_result["answer"]
        
        placeholders_found = {}
        try:
            # Clean markdown code blocks if present
            cleaned_answer = re.sub(r'```json\s*|\s*```', '', answer).strip()
            # Find JSON object
            json_match = re.search(r'\{.*\}', cleaned_answer, re.DOTALL)
            if json_match:
                placeholders_found = json.loads(json_match.group(0))
        except Exception as parse_error:
            print(f"Error parsing JSON from LLM: {parse_error}")
            # Fallback: empty

        return {
            "placeholders_found": placeholders_found,
            "extracted_text_length": extracted_text_length
        }

    except Exception as e:
        print(f"Error analyzing document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import BackgroundTasks
from .core.rag.ingestion import run_ingestion

@app.post("/rag/ingest")
async def trigger_ingestion(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_ingestion)
    return {"status": "started", "message": "Ingestion running in background"}

