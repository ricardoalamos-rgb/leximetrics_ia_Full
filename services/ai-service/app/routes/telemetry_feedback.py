from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.telemetry import TelemetryLogger

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

class FeedbackPayload(BaseModel):
    correlation_id: str = Field(..., description="ID devuelto por /ask")
    useful: bool = Field(..., description="true si la respuesta fue útil, false si no lo fue")
    comment: str | None = Field(None, description="Comentario opcional del usuario")

@router.post("/feedback")
def post_feedback(payload: FeedbackPayload):
    telemetry = TelemetryLogger.instance()
    try:
        telemetry.log_feedback(
            correlation_id=payload.correlation_id,
            useful=payload.useful,
            comment=payload.comment,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"status": "ok"}
