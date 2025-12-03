import os
from pathlib import Path
from dotenv import load_dotenv

# Cargamos .env desde el monorepo (dos niveles arriba)
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent.parent
env_path = ROOT_DIR / '.env'
if env_path.exists():
    load_dotenv(env_path)

# --- GEMINI ---
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL_NAME: str = os.getenv("GEMINI_MODEL_NAME", "gemini-2.0-flash")

if not GEMINI_API_KEY:
    # Warning instead of error to allow build without env vars
    print("WARNING: GEMINI_API_KEY no está configurada en el entorno.")

# --- CHROMA / RAG ---
CHROMA_PERSIST_DIR: str = os.getenv("JARVIS_CHROMA_DIR", str(BASE_DIR / "chroma_db"))
EMBEDDING_MODEL_NAME: str = os.getenv(
    "JARVIS_EMBEDDING_MODEL",
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
)

TOP_K_RESULTS: int = int(os.getenv("JARVIS_TOP_K_RESULTS", "5"))



# --- GENERAL ---
SERVICE_NAME: str = "JARVIS 4.0 - Leximetrics"
ENV: str = os.getenv("NODE_ENV", os.getenv("ENVIRONMENT", "development"))
DEBUG: bool = ENV != "production"
