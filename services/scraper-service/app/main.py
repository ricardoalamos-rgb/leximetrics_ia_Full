import os
import logging
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from app.scraper.pjud import scrape_case_detail

# Load environment variables
load_dotenv("../../../.env")

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Leximetrics Scraper Service (PJUD)")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth Middleware
SCRAPER_SERVICE_TOKEN = os.getenv("SCRAPER_SERVICE_TOKEN")

async def verify_token(x_service_token: str = Header(...)):
    if x_service_token != SCRAPER_SERVICE_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid Service Token")

class ScrapeRequest(BaseModel):
    rut: str
    password: str
    rit: str
    tribunal: str
    tenant_id: str

@app.post("/pjud/scrape", dependencies=[Depends(verify_token)])
async def scrape_pjud(request: ScrapeRequest):
    try:
        logger.info(f"Starting scrape for RIT: {request.rit}, Tribunal: {request.tribunal}")
        result = await scrape_case_detail(
            request.rut,
            request.password,
            request.rit,
            request.tribunal
        )
        return result
    except Exception as e:
        logger.error(f"Error scraping PJUD: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "ok"}
