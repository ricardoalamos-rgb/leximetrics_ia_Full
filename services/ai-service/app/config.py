import os
from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Configuración centralizada para JARVIS Backend.
    Lee variables de entorno o usa valores por defecto seguros.
    """
    # Gemini
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "dummy_key_for_build")
    OPENAI_API_KEY: str = os.environ.get("OPENAI_API_KEY", "dummy_key_for_build")
    MODEL_NAME: str = "gemini-2.0-flash"
    GEMINI_ENDPOINT: str = "https://generativelanguage.googleapis.com/v1beta/models"

    # ChromaDB & RAG
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    EMBEDDING_MODEL: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    TOP_K_RESULTS: int = 5

    # TTS
    TTS_ENABLED: bool = True
    TTS_LANG: str = "es"
    TTS_PROVIDER: str = "gtts"  # gtts | premium
    TTS_PREMIUM_API_KEY: Optional[str] = os.environ.get("TTS_PREMIUM_API_KEY")

    # System
    LOG_LEVEL: str = "INFO"
    ALLOW_ORIGINS: List[str] = ["*"]

    # Telemetry
    TELEMETRY_ENABLED: bool = True
    TELEMETRY_DB_PATH: str = "./jarvis_telemetry.db"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
