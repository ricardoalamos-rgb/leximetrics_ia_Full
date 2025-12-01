from fastapi import APIRouter
from app.core.rag.knowledge_base import knowledge_base
import json
import os
import time

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

@router.get("/indexing")
def get_indexing_status():
    """
    Retorna estado de indexación: libros, práctica forense, cache externo,
    y progreso del incremental_indexer.
    """
    counts = {
        "practica_forense": knowledge_base.get_collection_count("practica_forense"),
        "libros": knowledge_base.get_collection_count("libros"),
        "jurisprudencia": knowledge_base.get_collection_count("jurisprudencia"),
        "legislacion": knowledge_base.get_collection_count("legislacion"),
        "doctrina": knowledge_base.get_collection_count("doctrina"),
        "external_cache": knowledge_base.get_collection_count("external_cache"),
    }

    progress = {}
    progress_path = os.path.join(os.path.dirname(__file__), "..", "..", "indexing_progress.json")
    try:
        with open(os.path.abspath(progress_path), "r", encoding="utf-8") as f:
            progress = json.load(f)
    except FileNotFoundError:
        progress = {"status": "not_started"}

    return {
        "timestamp": int(time.time()),
        "counts": counts,
        "indexing_progress": progress,
    }
