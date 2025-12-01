from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from .config import SERVICE_NAME, DEBUG, TTS_ENABLED, TTS_LANG, TTS_CACHE_DIR, TTS_SPEED, TTS_PITCH_SHIFT
from .core.rag.rag_system import rag_system
from gtts import gTTS
from hashlib import md5
from pathlib import Path
import subprocess
import os
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
    Endpoint principal: RAG + Gemini. Opcionalmente genera audio TTS.
    """
    try:
        rag_result = rag_system.answer_question(body.question, body.extra_context)
        audio_url = None

        if TTS_ENABLED and body.speak:
            audio_url = generate_tts_for_text(body.question, rag_result["answer"])

        return AskResponse(
            answer=rag_result["answer"],
            sources=rag_result["sources"],
            audioUrl=audio_url,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tts", response_model=TTSResponse)
def tts_endpoint(body: TTSRequest):
    if not TTS_ENABLED:
        raise HTTPException(status_code=400, detail="TTS deshabilitado.")
    try:
        audio_url = generate_tts_for_text("Usuario", body.text)
        return TTSResponse(audioUrl=audio_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def generate_tts_for_text(prompt_seed: str, text: str) -> str:
    """
    Genera un archivo MP3 con voz masculina, grave, similar a Jarvis:
    - gTTS (es) como base (voz neutra)
    - ffmpeg: bajamos un poco el pitch y la velocidad con filtros
      asetrate + aresample + atempo.
    Devuelve ruta relativa /audio/<filename>.
    """
    # Hash del texto + prompt para cache
    h = md5((prompt_seed + "|" + text).encode("utf-8")).hexdigest()
    raw_path = TTS_CACHE_DIR / f"{h}_raw.mp3"
    final_path = TTS_CACHE_DIR / f"{h}_jarvis_masc.mp3"

    if final_path.exists():
        return f"/audio/{final_path.name}"

    # 1) gTTS base (voz neutra/femenina español)
    tts = gTTS(text=text, lang=TTS_LANG, slow=False)
    tts.save(str(raw_path))

    # 2) ffmpeg: bajamos pitch y un poquito velocidad para sensación más grave
    # - asetrate: cambia frecuencia de muestreo → pitch
    # - aresample: normaliza de vuelta a 44.1k
    # - atempo: ajusta velocidad (TTS_SPEED < 1.0 = más lento)
    pitch_factor = TTS_PITCH_SHIFT  # 0.9 → ~ un semitono más grave
    filter_chain = (
        f"asetrate=44100*{pitch_factor},aresample=44100,atempo={TTS_SPEED}"
    )

    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(raw_path),
        "-filter:a",
        filter_chain,
        str(final_path),
    ]

    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Opcional: borrar el raw para ahorrar espacio
    try:
        raw_path.unlink()
    except Exception:
        pass

    return f"/audio/{final_path.name}"


# Servir archivos de audio de forma estática
from fastapi.staticfiles import StaticFiles

audio_dir = str(TTS_CACHE_DIR)
os.makedirs(audio_dir, exist_ok=True)
app.mount("/audio", StaticFiles(directory=audio_dir), name="audio")
