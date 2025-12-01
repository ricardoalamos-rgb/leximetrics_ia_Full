from fastapi import APIRouter
from app.services.scrapers.pjud_scraper_playwright_v2 import pjud_scraper_v2
from app.services.scrapers.bcn_scraper import quick_health_check as bcn_health_check
from app.services.scrapers.scielo_scraper import quick_health_check as scielo_health_check

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

@router.get("/scrapers-health")
def scrapers_health():
    """
    Realiza pruebas rápidas en los scrapers PJUD/BCN/SciELO.
    NO hace scraping intensivo, solo verifica reachability básica.
    """
    pjud_ok = False
    pjud_error = None
    try:
        pjud_ok = pjud_scraper_v2.health_check()
    except Exception as e:
        pjud_error = str(e)

    bcn_ok = False
    bcn_error = None
    try:
        bcn_ok = bcn_health_check()
    except Exception as e:
        bcn_error = str(e)

    scielo_ok = False
    scielo_error = None
    try:
        scielo_ok = scielo_health_check()
    except Exception as e:
        scielo_error = str(e)

    return {
        "pjud": {"ok": pjud_ok, "error": pjud_error},
        "bcn": {"ok": bcn_ok, "error": bcn_error},
        "scielo": {"ok": scielo_ok, "error": scielo_error},
    }
