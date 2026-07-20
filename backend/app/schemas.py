from pydantic import BaseModel
from typing import List

class AnalyzeRequest(BaseModel):
    text: str

class EntityResult(BaseModel):
    word: str
    entity_group: str
    score: float

class SentimentResult(BaseModel):
    label: str  # Positif, Neutre, Négatif
    score: float

class AnalyzeResponse(BaseModel):
    sentiment: SentimentResult
    summary: str
    entities: List[EntityResult]
    execution_time_ms: float