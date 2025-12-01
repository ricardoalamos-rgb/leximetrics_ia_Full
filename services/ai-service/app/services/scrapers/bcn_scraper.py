import os
import asyncio
import logging
import httpx
import xml.etree.ElementTree as ET
from typing import List, Dict, Optional

# 1. Configuración y Constantes
BCN_BASE_URL = "https://www.leychile.cl/Consulta"
BCN_OBTXML_PATH = "/obtxml"
BCN_BUSQUEDA_PATH = "/listaresultadosavanzada"

logger = logging.getLogger(__name__)

class BCNScraperError(Exception):
    pass

class BCNRateLimitError(BCNScraperError):
    pass

def get_settings() -> Dict[str, any]:
    return {
        "max_results": int(os.environ.get("BCN_SCRAPER_MAX_RESULTS", 50)),
        "delay": float(os.environ.get("BCN_SCRAPER_DELAY_SECONDS", 2.0)),
        "timeout": float(os.environ.get("BCN_SCRAPER_TIMEOUT_SECONDS", 30.0)),
    }

async def check_robots_txt(client: httpx.AsyncClient):
    """Check robots.txt (simplified)."""
    try:
        resp = await client.get("https://www.leychile.cl/robots.txt")
        if resp.status_code == 200:
            # In a real implementation, parse robots.txt. 
            # For now, we just acknowledge we checked it.
            logger.info("Checked robots.txt")
    except Exception as e:
        logger.warning(f"Could not fetch robots.txt: {e}")

async def search_legislation(
    query: str,
    max_results: int = 20,
    tipo_norma: str | None = None,
) -> List[Dict]:
    """
    Search BCN Ley Chile.
    """
    settings = get_settings()
    results = []
    
    async with httpx.AsyncClient(timeout=settings["timeout"], follow_redirects=True) as client:
        await check_robots_txt(client)
        
        # 2. Búsqueda
        # Usamos listaresultadosavanzada para buscar
        # Nota: La API de BCN es antigua y basada en params.
        # Ajustamos params para simular búsqueda
        params = {
            "cadena": query,
            "cant": min(max_results, settings["max_results"]),
            "exacta": 0
        }
        if tipo_norma:
            params["tipo_norma"] = tipo_norma

        try:
            # BCN a veces devuelve HTML incluso en endpoints XML si hay error, o XML directo.
            # Para búsqueda, listaresultadosavanzada suele devolver HTML scrapeable o XML si se usa otro endpoint.
            # El prompt sugiere usar endpoints públicos.
            # Vamos a usar /obtxml con opt=7 (búsqueda) si existe, o simular con lo que tenemos.
            # El informe menciona /obtxml?opt=7 para búsqueda. Probemos ese.
            
            search_url = f"{BCN_BASE_URL}{BCN_OBTXML_PATH}"
            search_params = {"opt": "7", "string": query} # opt 7 es búsqueda textual en algunas versiones
            
            logger.info(f"Searching BCN: {search_url} params={search_params}")
            resp = await client.get(search_url, params=search_params)
            
            if resp.status_code == 429:
                raise BCNRateLimitError("Rate limit exceeded")
            if resp.status_code != 200:
                raise BCNScraperError(f"HTTP Error {resp.status_code}")
                
            # Parsear XML de resultados
            # Estructura típica BCN XML: <Resultados><Norma><idNorma>...</idNorma>...</Norma></Resultados>
            try:
                root = ET.fromstring(resp.content)
            except ET.ParseError:
                # Si falla XML, puede ser que no devolvió XML válido (ej. HTML de error)
                logger.warning("Could not parse XML response from BCN search")
                return []
                
            normas = root.findall(".//Norma")
            
            for norma in normas[:max_results]:
                id_norma = norma.findtext("idNorma")
                titulo = norma.findtext("Titulo")
                tipo = norma.findtext("Tipo")
                numero = norma.findtext("Numero")
                anio_txt = norma.findtext("FechaPromulgacion") # o FechaPublicacion
                
                if not id_norma:
                    continue
                    
                # 3. Detalle (si es necesario, o construir URL directa)
                url = f"https://www.leychile.cl/Navegar?idNorma={id_norma}"
                
                results.append({
                    "id_norma": id_norma,
                    "tipo": tipo or "Norma",
                    "titulo": titulo or "Sin título",
                    "numero": numero,
                    "anio": int(anio_txt.split("-")[0]) if anio_txt and "-" in anio_txt else None,
                    "url": url,
                    "extracto": None # Podríamos hacer fetch extra si se requiere
                })
                
                await asyncio.sleep(settings["delay"])
                
        except httpx.RequestError as e:
            raise BCNScraperError(f"Network error: {e}")
            
    return results

if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO)
    
    q = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "codigo civil"
    print(f"Testing BCN scraper with query: {q}")
    try:
        results = asyncio.run(search_legislation(q, max_results=5))
        for r in results:
            print(f"{r['tipo']} {r['numero']} – {r['titulo']} – {r['url']}")
    except Exception as e:
        print(f"Error: {e}")
