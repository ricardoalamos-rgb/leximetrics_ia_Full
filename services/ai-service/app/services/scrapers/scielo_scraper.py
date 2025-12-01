import os
import asyncio
import logging
import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Optional

# 1. Configuración y Constantes
SCIELO_BASE_URL = "https://scielo.conicyt.cl"

logger = logging.getLogger(__name__)

class ScieloScraperError(Exception):
    pass

class ScieloRateLimitError(ScieloScraperError):
    pass

def get_settings() -> Dict[str, any]:
    return {
        "max_results": int(os.environ.get("SCIELO_SCRAPER_MAX_RESULTS", 50)),
        "delay": float(os.environ.get("SCIELO_SCRAPER_DELAY_SECONDS", 3.0)),
        "timeout": float(os.environ.get("SCIELO_SCRAPER_TIMEOUT_SECONDS", 30.0)),
        "user_agent": os.environ.get("SCIELO_SCRAPER_USER_AGENT", "Mozilla/5.0 (compatible; JarvisBot/1.0)"),
    }

async def search_scielo(
    query: str,
    max_results: int = 20,
    revista: str | None = None,
) -> List[Dict]:
    """
    Search SciELO Chile.
    """
    settings = get_settings()
    results = []
    
    headers = {
        "User-Agent": settings["user_agent"],
        "Accept-Language": "es-CL,es;q=0.9"
    }
    
    async with httpx.AsyncClient(timeout=settings["timeout"], headers=headers, follow_redirects=True) as client:
        # 2. Check robots.txt (simplified)
        try:
            await client.get(f"{SCIELO_BASE_URL}/robots.txt")
        except:
            pass
            
        # 3. Búsqueda
        # SciELO search url pattern: /scielo.php?script=sci_search&lng=es&org=SCIA&count=20&from=0&output=html&q=...
        search_url = f"{SCIELO_BASE_URL}/scielo.php"
        params = {
            "script": "sci_search",
            "lng": "es",
            "org": "SCIA",
            "count": str(min(max_results, settings["max_results"])),
            "from": "0",
            "output": "html",
            "q": query
        }
        
        # Filtro revista (si supiéramos el código exacto, por ahora búsqueda general)
        
        try:
            logger.info(f"Searching SciELO: {query}")
            resp = await client.get(search_url, params=params)
            
            if resp.status_code == 403:
                # Retry once
                logger.warning("SciELO 403, retrying...")
                await asyncio.sleep(settings["delay"] * 2)
                resp = await client.get(search_url, params=params)
                if resp.status_code == 403:
                    raise ScieloRateLimitError("Access denied (403)")
            
            if resp.status_code != 200:
                raise ScieloScraperError(f"HTTP Error {resp.status_code}")
                
            soup = BeautifulSoup(resp.content, "html.parser")
            
            # Parsear resultados
            # Estructura SciELO search results: div.results > div.item
            items = soup.select(".results .item")
            
            for item in items[:max_results]:
                # Título
                title_el = item.select_one(".title a")
                if not title_el:
                    continue
                
                titulo = title_el.get_text(strip=True)
                url_html = title_el.get("href")
                if url_html and not url_html.startswith("http"):
                    url_html = f"{SCIELO_BASE_URL}{url_html}"
                    
                # Autores
                authors_el = item.select(".author")
                autores = [a.get_text(strip=True) for a in authors_el]
                
                # Revista
                source_el = item.select_one(".source")
                revista_txt = source_el.get_text(strip=True) if source_el else "SciELO"
                
                # Resumen (a veces en el listado, a veces hay que entrar)
                # Por eficiencia, tomamos lo que hay en el listado si existe
                abstract_el = item.select_one(".abstract")
                resumen = abstract_el.get_text(strip=True) if abstract_el else None
                
                results.append({
                    "titulo": titulo,
                    "autores": autores,
                    "revista": revista_txt,
                    "anio": None, # Difícil de extraer del listado sin entrar
                    "url_html": url_html,
                    "url_pdf": None, # Requiere entrar al artículo
                    "resumen": resumen,
                    "palabras_clave": None
                })
                
                await asyncio.sleep(settings["delay"])
                
        except httpx.RequestError as e:
            raise ScieloScraperError(f"Network error: {e}")
            
    return results

if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO)
    
    q = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "responsabilidad extracontractual"
    print(f"Testing SciELO scraper with query: {q}")
    try:
        results = asyncio.run(search_scielo(q, max_results=5))
        for art in results:
            print(f"{art['revista']} – {art['titulo']} – {art['url_html']}")
    except Exception as e:
        print(f"Error: {e}")
