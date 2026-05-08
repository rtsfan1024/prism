"""Pydantic models for style API boundaries."""

from typing import Optional

from pydantic import BaseModel


class StyleCandidate(BaseModel):
    """A single style candidate image."""

    filename: str
    url: str


class GenerateStyleRequest(BaseModel):
    """Request body for generating style candidates."""

    prompt: str


class GenerateStyleResponse(BaseModel):
    """Response after generating style candidates."""

    candidates: list[StyleCandidate]
    generation_cost: float


class SelectStyleRequest(BaseModel):
    """Request body for selecting and saving a style."""

    prompt: str
    selected_image: str


class StyleResponse(BaseModel):
    """Response with the current style configuration."""

    prompt: str
    image: str
    image_url: str


class GetStyleResponse(BaseModel):
    """Response for GET style endpoint."""

    has_style: bool
    style: Optional[StyleResponse] = None


class SelectStyleResponse(BaseModel):
    """Response after selecting a style."""

    success: bool
    style: StyleResponse
