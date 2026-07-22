from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.explainability import explain_score
from app.services.fairness import audit_fairness

router = APIRouter(tags=["analysis"])


class ExplainRequest(BaseModel):
    resumeScore: float = Field(ge=0, le=100)
    videoScore: float = Field(ge=0, le=100)
    voiceScore: float = Field(ge=0, le=100)


@router.post("/explain")
async def explain_endpoint(payload: ExplainRequest):
    return explain_score(payload.resumeScore, payload.videoScore, payload.voiceScore)


class FairnessRecord(BaseModel):
    applicationId: str
    finalScore: float
    groupLabel: str


class FairnessRequest(BaseModel):
    records: list[FairnessRecord]
    threshold: float = 70.0


@router.post("/fairness-report")
async def fairness_endpoint(payload: FairnessRequest):
    try:
        records = [r.model_dump() for r in payload.records]
        result = audit_fairness(records, payload.threshold)
        return result
    except Exception as exc:
        raise HTTPException(500, f"Fairness audit failed: {exc}")
