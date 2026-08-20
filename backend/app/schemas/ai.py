from typing import Optional, List
from pydantic import BaseModel, Field


class AIAnalysisRequest(BaseModel):
    vulnerability_id: int


class AIAnalysisResponse(BaseModel):
    vulnerability_id: int
    summary: str
    impact_explanation: str
    remediation_guidance: str
    verification_steps: str
    is_ai_available: bool = True
    provider: str = "gemini"


class AIChatRequest(BaseModel):
    prompt: str = Field(..., min_length=2, max_length=2000)
    context_vulnerability_id: Optional[int] = None
    context_application_id: Optional[int] = None


class AIChatResponse(BaseModel):
    reply: str
    is_ai_available: bool = True
    provider: str = "gemini"
