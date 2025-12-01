import asyncio
import logging
import time
from typing import List, Dict, Optional

from app.core.rag.knowledge_base import knowledge_base
from app.services.external_search_cache import ExternalSearchCache
from app.services.scrapers import pjud_scraper_playwright_v2 as pjud
from app.services.scrapers import bcn_scraper as bcn
from app.services.scrapers import scielo_scraper as scielo
from app.services.telemetry import TelemetryLogger

logger = logging.getLogger(__name__)

# Initialize cache
cache = ExternalSearchCache(knowledge_base)

async def search_local(query: str, top_k: int) -> List[Dict]:
    """Search local ChromaDB collections."""
    collections = ["practica_forense", "libros", "jurisprudencia", "legislacion", "doctrina"]
    results = []
    
    # Distribute top_k somewhat evenly or just query all and rank
    k_per_col = max(2, int(top_k / 2))
    
    for col in collections:
        try:
            hits = knowledge_base.search(col, query, top_k=k_per_col)
            for h in hits:
                h["source_type"] = col
                results.append(h)
        except Exception as e:
            logger.warning(f"Error searching local collection {col}: {e}")
            
    return results

async def search_external_source(source_name: str, query: str, top_k: int) -> List[Dict]:
    """Search a single external source with caching."""
    results = []
    
    # 1. Check Cache
    cached_hits = cache.get(query, source_name)
    if cached_hits:
        logger.info(f"Cache hit for {source_name}: {len(cached_hits)} results")
        # Normalize cached hits
        for h in cached_hits:
            # Ensure source_type is set
            h["source_type"] = source_name
            # Ensure score (cache might have it, or we assign default)
            if "score" not in h:
                h["score"] = 0.85 # High confidence for cache? Or just base.
            results.append(h)
        return results[:top_k]
        
    # 2. Scrape if no cache
    try:
        scraped_data = []
        if source_name == "pjud":
            scraped_data = await pjud.search(query, max_results=top_k)
        elif source_name == "bcn":
            scraped_data = await bcn.search_legislation(query, max_results=top_k)
        elif source_name == "scielo":
            scraped_data = await scielo.search_scielo(query, max_results=top_k)
            
        # 3. Cache results
        if scraped_data:
            cache.set(query, source_name, scraped_data)
            
        # 4. Normalize to Chunk format
        for item in scraped_data:
            # Create a text representation for the 'document' field
            # This depends on the source structure
            doc_text = ""
            if source_name == "pjud":
                doc_text = f"SENTENCIA: {item.get('caratulado')} ROL: {item.get('rol')} FECHA: {item.get('fecha')} RESUMEN: {item.get('resumen')}"
            elif source_name == "bcn":
                doc_text = f"NORMA: {item.get('tipo')} {item.get('numero')} TITULO: {item.get('titulo')} URL: {item.get('url')}"
            elif source_name == "scielo":
                doc_text = f"ARTICULO: {item.get('titulo')} REVISTA: {item.get('revista')} AUTORES: {', '.join(item.get('autores', []))}"
                
            results.append({
                "source_type": source_name,
                "score": 0.8, # Base score for fresh external data
                "document": doc_text,
                "metadata": item # Store full raw data in metadata
            })
            
    except Exception as e:
        logger.error(f"Error scraping {source_name}: {e}")
        
    return results[:top_k]

def _compute_score(item: Dict, weights: Dict[str, float]) -> float:
    """Compute adjusted score based on base score and learned weights."""
    base_score = item.get("score", 0.5)
    source = item.get("source_type", "unknown")
    weight = weights.get(source, 1.0)
    return base_score * weight

async def multi_source_search(
    query: str,
    top_k: int = 5,
    use_external: bool = True,
    rag_query_id: Optional[int] = None,
) -> List[Dict]:
    """
    Orchestrate search across local and external sources.
    """
    tasks = []
    
    # 1. Local Search
    tasks.append(search_local(query, top_k))
    
    # 2. External Search
    if use_external:
        tasks.append(search_external_source("pjud", query, top_k))
        tasks.append(search_external_source("bcn", query, top_k))
        tasks.append(search_external_source("scielo", query, top_k))
        
    # Execute all
    results_lists = await asyncio.gather(*tasks)
    
    # Flatten results
    all_results = []
    for lst in results_lists:
        all_results.extend(lst)
        
    # 3. Apply Telemetry Weights
    telemetry = TelemetryLogger.instance()
    area = None
    if rag_query_id:
        area = telemetry.get_area_for_query(rag_query_id)
    
    source_weights = telemetry.get_source_weights(default=1.0, area=area)
    
    # Calculate adjusted scores
    for r in all_results:
        r["adjusted_score"] = _compute_score(r, source_weights)
        
    # 4. Rank
    all_results.sort(key=lambda x: x["adjusted_score"], reverse=True)
    
    final_results = all_results[:top_k]
    
    # Log sources used
    if rag_query_id:
        sources_used = list(set(r["source_type"] for r in final_results))
        telemetry.log_sources_for_query(rag_query_id, sources_used)
        
    return final_results
