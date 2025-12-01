import os
import logging
import asyncio
import urllib.parse
from typing import List, Dict, Optional
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError

# 1. Configuración y Constantes
PJUD_BASE_URL = "https://juris.pjud.cl"
PJUD_SEARCH_PATH = "/busqueda"

logger = logging.getLogger(__name__)

class PJUDScraperError(Exception):
    """Base exception for PJUD scraper errors."""
    pass

class PJUDRateLimitError(PJUDScraperError):
    """Raised when rate limiting is detected."""
    pass

class PJUDStructureChangedError(PJUDScraperError):
    """Raised when expected DOM structure is not found."""
    pass

def get_settings() -> Dict[str, any]:
    """Load settings from environment variables with defaults."""
    return {
        "max_results": min(int(os.environ.get("PJUD_SCRAPER_MAX_RESULTS", 50)), 200),
        "headless": os.environ.get("PJUD_SCRAPER_HEADLESS", "true").lower() == "true",
        "delay": float(os.environ.get("PJUD_SCRAPER_DELAY_SECONDS", 2.0)),
        "page_timeout": float(os.environ.get("PJUD_SCRAPER_PAGE_TIMEOUT", 60.0)) * 1000, # ms
    }

async def search(
    query: str,
    corte: str | None = None,
    max_results: int = 20,
    timeout_seconds: float | None = None,
) -> List[Dict]:
    """
    Search PJUD Jurisprudencia using Playwright.
    
    Args:
        query: Search text.
        corte: Optional court filter.
        max_results: Max results to return.
        timeout_seconds: Optional timeout override.
        
    Returns:
        List of result dictionaries.
    """
    settings = get_settings()
    effective_max = min(max_results, settings["max_results"])
    timeout = (timeout_seconds * 1000) if timeout_seconds else settings["page_timeout"]
    
    logger.info(f"Starting PJUD search: query='{query}', corte={corte}, max={effective_max}")
    
    results = []
    
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=settings["headless"])
            # User Agent rotation logic could go here, using a fixed one for now or env var
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            page.set_default_timeout(timeout)
            
            # 2. Navegación
            search_url = f"{PJUD_BASE_URL}{PJUD_SEARCH_PATH}"
            await page.goto(search_url)
            
            # Wait for search input
            # Note: Selectors need to be verified against actual site. Using generic semantic ones as placeholder/best guess based on prompt.
            # In a real scenario, we would inspect the DOM. Assuming standard inputs.
            try:
                # Esperar input de búsqueda. Ajustar selector según inspección real si falla.
                # Buscamos un input que probablemente sea type="text" o tenga un placeholder de búsqueda
                search_input = page.locator("input[placeholder*='Buscar'], input[type='text']").first
                await search_input.wait_for(state="visible")
                await search_input.fill(query)
            except PlaywrightTimeoutError:
                raise PJUDStructureChangedError("Could not find search input field")
            
            # Filtro de corte (si aplica)
            if corte:
                # Lógica para seleccionar corte. Asumiendo un dropdown o similar.
                # Esto es frágil sin ver el DOM real.
                pass 

            # Click buscar
            try:
                search_button = page.locator("button:has-text('Buscar'), button[type='submit']").first
                await search_button.click()
            except PlaywrightTimeoutError:
                raise PJUDStructureChangedError("Could not find search button")
            
            # 3. Extracción de resultados
            # Esperar tabla o lista de resultados
            try:
                # Asumiendo una tabla o lista de cartas
                # Ajustar selector: .result-item, tr, etc.
                # Esperamos a que aparezca al menos un resultado o mensaje de "no encontrado"
                await page.wait_for_selector("table tbody tr, .result-card", timeout=10000)
            except PlaywrightTimeoutError:
                # Puede ser que no haya resultados
                logger.warning("No results found or timeout waiting for results table")
                return []

            # Iterar resultados
            # Selector genérico para filas
            rows = page.locator("table tbody tr")
            count = await rows.count()
            
            for i in range(min(count, effective_max)):
                row = rows.nth(i)
                
                # Extraer datos (selectores hipotéticos, ajustar con DOM real)
                # Rol, Caratulado, Fecha, Sala, Resultado
                # Asumimos orden de columnas o clases específicas
                
                # Ejemplo:
                # td 0: Rol
                # td 1: Fecha
                # td 2: Caratulado
                # ...
                
                # Para robustez, intentamos extraer texto de celdas
                cells = row.locator("td")
                if await cells.count() < 3:
                    continue
                    
                rol = await cells.nth(0).inner_text()
                fecha = await cells.nth(1).inner_text()
                caratulado = await cells.nth(2).inner_text()
                
                # Link a sentencia
                # Buscar un <a> dentro de la fila
                link_el = row.locator("a[href*='doc'], a[href*='sentencia']").first
                url = None
                if await link_el.count() > 0:
                    href = await link_el.get_attribute("href")
                    if href:
                        url = urllib.parse.urljoin(PJUD_BASE_URL, href)
                
                # Resumen (si existe detalle expandible o columna)
                resumen = f"{caratulado} - {rol}" 
                
                results.append({
                    "rol": rol.strip(),
                    "caratulado": caratulado.strip(),
                    "fecha": fecha.strip(),
                    "sala": None, # Extraer si hay columna
                    "resultado": None, # Extraer si hay columna
                    "url": url,
                    "resumen": resumen
                })
                
                # Rate limit delay
                await asyncio.sleep(settings["delay"])
                
            await browser.close()
            
    except Exception as e:
        logger.error(f"Error in PJUD scraper: {str(e)}")
        if isinstance(e, PJUDScraperError):
            raise
        raise PJUDScraperError(f"Unexpected error: {str(e)}")
        
    logger.info(f"PJUD search finished. Found {len(results)} results.")
    return results

if __name__ == "__main__":
    import sys
    
    # Configurar logging para ver output en CLI
    logging.basicConfig(level=logging.INFO)

    query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "responsabilidad civil"
    corte = None
    
    print(f"Testing PJUD scraper with query: {query}")
    try:
        results = asyncio.run(search(query=query, corte=corte, max_results=5))
        for r in results:
            print(f"{r['rol']} – {r['caratulado']} – {r['fecha']} – {r['url']}")
    except Exception as e:
        print(f"Error: {e}")
