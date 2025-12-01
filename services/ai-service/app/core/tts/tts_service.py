import os
import uuid
import logging
from pathlib import Path
from gtts import gTTS
import requests

logger = logging.getLogger(__name__)

TTS_CACHE_DIR = Path("static/audio_cache")
TTS_CACHE_DIR.mkdir(parents=True, exist_ok=True)

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID_JARVIS", "21m00Tcm4TlvDq8ikWAM") # Default voice

def generate_audio(text: str) -> str:
    """
    Generates audio from text using ElevenLabs (if configured) or gTTS (fallback).
    Returns the relative path to the audio file.
    """
    filename = f"{uuid.uuid4()}.mp3"
    filepath = TTS_CACHE_DIR / filename
    
    # Try ElevenLabs
    if ELEVENLABS_API_KEY:
        try:
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": ELEVENLABS_API_KEY
            }
            data = {
                "text": text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75
                }
            }
            response = requests.post(url, json=data, headers=headers)
            if response.status_code == 200:
                with open(filepath, "wb") as f:
                    f.write(response.content)
                logger.info(f"Generated audio via ElevenLabs: {filename}")
                return f"/static/audio_cache/{filename}"
            else:
                logger.warning(f"ElevenLabs failed ({response.status_code}): {response.text}")
        except Exception as e:
            logger.error(f"Error calling ElevenLabs: {e}")

    # Fallback to gTTS
    try:
        tts = gTTS(text=text, lang='es', tld='com') # 'com' is often more neutral/US, 'es' default is Spain
        tts.save(str(filepath))
        logger.info(f"Generated audio via gTTS: {filename}")
        return f"/static/audio_cache/{filename}"
    except Exception as e:
        logger.error(f"Error generating audio with gTTS: {e}")
        return ""
