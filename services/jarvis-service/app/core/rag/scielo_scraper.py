import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class ScieloScraper:
    BASE_URL = "https://search.scielo.org/"

    def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Busca artículos en SciELO (colección Chile y otros si aplica)
        """
        try:
            params = {
                "q": query,
                "lang": "es",
                "count": limit,
                "from": 0,
                "output": "site",
                "sort": "",
                "format": "summary",
                "fb": "",
                "page": 1,
            }
            
            # SciELO a veces requiere headers para no bloquear
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }

            response = requests.get(self.BASE_URL, params=params, headers=headers, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")
            results = []

            # Los resultados suelen estar en divs con clase 'item' o similar, 
            # pero la estructura de SciELO search varía. 
            # Inspección visual (asumida por screenshot): 
            # Los items suelen estar dentro de un contenedor de resultados.
            # Buscaremos patrones comunes en search.scielo.org
            
            # En la versión actual de search.scielo.org:
            # <div class="results"> ... <div class="item"> ...
            
            items = soup.find_all("div", class_="item")
            
            for item in items:
                try:
                    title_tag = item.find("div", class_="line").find("a")
                    if not title_tag:
                        continue
                        
                    title = title_tag.get_text(strip=True)
                    link = title_tag.get("href")
                    
                    # Intentar sacar autores o resumen si existe
                    authors_div = item.find("div", class_="authors")
                    authors = authors_div.get_text(strip=True) if authors_div else "Desconocido"
                    
                    # Metadata (año, revista)
                    source_div = item.find("div", class_="source")
                    source_text = source_div.get_text(strip=True) if source_div else ""

                    results.append({
                        "source_name": "SciELO",
                        "title": title,
                        "url": link,
                        "content": f"{title}. Autores: {authors}. Fuente: {source_text}", # Snippet para el LLM
                        "score": 1.0 # Relevancia manual por ser búsqueda directa
                    })
                except Exception as e:
                    logger.warning(f"Error parseando item SciELO: {e}")
                    continue

            return results

        except Exception as e:
            logger.error(f"Error scraping SciELO: {e}")
            return []

scielo_scraper = ScieloScraper()
