import os
import logging
from typing import Optional, Dict, Any

import httpx

logger = logging.getLogger(__name__)

API_CORE_URL = os.getenv("API_CORE_BASE_URL", "http://host.docker.internal:4000/api/v1")
SERVICE_AUTH_TOKEN = os.getenv("SCRAPER_SERVICE_TOKEN")  # Reusamos el token interno

# Precios aproximados por millón de tokens (puedes ajustarlos desde env si quieres)
PRICING: Dict[str, Dict[str, float]] = {
    # modelo: {input_price, output_price}
    "gpt-4o": {"input": 5e-6, "output": 15e-6},
    "gpt-4o-mini": {"input": 0.15e-6, "output": 0.6e-6},
}


def compute_cost_usd(
    provider: str,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
) -> float:
    key = model
    prices = PRICING.get(key)
    if not prices:
        # fallback por si el modelo no está mapeado
        return 0.0
    return prompt_tokens * prices["input"] + completion_tokens * prices["output"]


async def log_ai_usage(
    *,
    tenant_id: str,
    user_id: Optional[str],
    feature: str,
    provider: str,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int,
    cost_usd: float,
    latency_ms: Optional[int] = None,
    correlation_id: Optional[str] = None,
    source: str = "ai-service",
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    if not SERVICE_AUTH_TOKEN:
        logger.warning("SCRAPER_SERVICE_TOKEN not set. Telemetry will not be sent.")
        return

    url = f"{API_CORE_URL}/telemetry/ai-usage"
    payload = {
        "tenantId": tenant_id,
        "userId": user_id,
        "feature": feature,
        "provider": provider.upper(),
        "model": model,
        "tokensPrompt": prompt_tokens,
        "tokensCompletion": completion_tokens,
        "tokensTotal": total_tokens,
        "costUsd": cost_usd,
        "latencyMs": latency_ms,
        "correlationId": correlation_id,
        "source": source,
        "metadata": metadata or {},
    }

    headers = {
        "Authorization": f"Bearer {SERVICE_AUTH_TOKEN}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code >= 400:
                logger.error(
                    f"Failed to send AI telemetry ({resp.status_code}): {resp.text}"
                )
    except Exception as e:
        logger.error(f"Error sending AI telemetry: {e}", exc_info=True)
