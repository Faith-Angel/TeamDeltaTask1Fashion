"""Pydantic response models for NdoloStitch ML Service."""

from datetime import datetime
from typing import Any, Optional, List, Union
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., description="'ok' or 'degraded'")
    clip_loaded: bool
    pinecone_connected: bool
    timestamp: datetime


class EmbeddingResponse(BaseModel):
    embedding: list[float] = Field(..., description="512-dimensional CLIP embedding vector")
    model: str = Field("clip-vit-b-32")
    cached: bool = Field(False)


class SearchResult(BaseModel):
    id: str
    score: float = Field(..., ge=0.0, le=1.0)
    image_url: str
    category: str
    traditional: bool
    region: str
    occasion: str
    price_range: str


class SimilarSearchResponse(BaseModel):
    results: list[SearchResult]
    query_time_ms: int


class DesignBrief(BaseModel):
    """Structured fashion design brief extracted from Gemini responses.
    
    Most fields are optional because Gemini may not return all of them
    in every response. The model accepts extra fields for flexibility.
    """
    
    # Core fields that Gemini actually returns
    occasion: Optional[str] = None
    style: Optional[Union[str, List[str]]] = None
    colors: Optional[Union[str, List[str]]] = None
    fabrics: Optional[Union[str, List[str]]] = None
    accessories: Optional[Union[str, List[str]]] = None
    budget: Optional[str] = None
    
    # Alternative field names Gemini might use (for compatibility)
    color_palette: Optional[Union[str, List[str]]] = None
    fabric_preference: Optional[str] = None
    budget_range_xaf: Optional[str] = None
    special_requirements: Optional[str] = None
    
    # Allow any extra fields (Gemini might add more)
    class Config:
        extra = "allow"


class StyleChatResponse(BaseModel):
    reply: str
    conversation_id: Optional[str] = None
    brief: Optional[DesignBrief] = None


class ErrorResponse(BaseModel):
    detail: str
    code: str | None = None