import logging
import os
import uuid
import subprocess
from pathlib import Path
from gtts import gTTS
from app.config import settings

logger = logging.getLogger(__name__)

class TTSService:
    """
    Servicio de Síntesis de Voz (TTS).
    Soporta fallback a gTTS y está preparado para proveedores premium.
    """
    def __init__(self):
        self.audio_dir = Path("audio_cache")
        self.audio_dir.mkdir(exist_ok=True)
        self.provider = settings.TTS_PROVIDER.lower()
        self.lang = settings.TTS_LANG

    def synthesize(self, text: str) -> dict:
        """
        Sintetiza texto a audio.
        Returns: { "filename": str, "path": str }
        """
        filename = f"jarvis_{uuid.uuid4().hex}.mp3"
        out_path = self.audio_dir / filename
        
        try:
            if self.provider == "premium" and settings.TTS_PREMIUM_API_KEY:
                self._synthesize_premium(text, out_path)
            else:
                self._synthesize_gtts(text, out_path)
                
            return {
                "filename": filename,
                "path": str(out_path.absolute())
            }
        except Exception as e:
            logger.error(f"TTS Error: {e}")
            raise

    def _synthesize_gtts(self, text: str, out_path: Path):
        """Fallback usando Google TTS (gratuito)."""
        logger.info(f"Synthesizing with gTTS: {text[:30]}...")
        tts = gTTS(text=text, lang=self.lang, slow=False)
        tts.save(str(out_path))
        
        # Opcional: Acelerar con ffmpeg si está disponible
        # Esto le da un toque más "robótico/rápido" estilo asistente
        try:
            temp_path = out_path.with_suffix(".temp.mp3")
            out_path.rename(temp_path)
            subprocess.run([
                "ffmpeg", "-i", str(temp_path), 
                "-filter:a", "atempo=1.25", 
                "-y", str(out_path)
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            temp_path.unlink()
        except (FileNotFoundError, subprocess.CalledProcessError):
            logger.warning("ffmpeg not found or failed, using original gTTS speed.")
            if temp_path.exists():
                temp_path.rename(out_path)

    def _synthesize_premium(self, text: str, out_path: Path):
        """
        Stub para integración con proveedor Premium (ElevenLabs, Azure, etc.).
        Debe implementar la llamada HTTP real usando settings.TTS_PREMIUM_API_KEY.
        """
        logger.warning("Premium TTS not implemented yet, falling back to gTTS.")
        self._synthesize_gtts(text, out_path)

tts_service = TTSService()
