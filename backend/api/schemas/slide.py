"""Pydantic models for slide API boundaries."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SlideResponse(BaseModel):
    """Response model for a single slide."""

    sid: str
    content: str
    content_hash: str
    created_at: datetime
    updated_at: datetime
    has_matching_image: bool
    image_count: int


class CreateSlideRequest(BaseModel):
    """Request body for creating a new slide."""

    title: Optional[str] = None
    content: str
    position: Optional[int] = None


class UpdateSlideRequest(BaseModel):
    """Request body for updating a slide's content."""

    content: str


class ReorderSlidesRequest(BaseModel):
    """Request body for reordering slides."""

    slide_ids: list[str]


class UpdateTitleRequest(BaseModel):
    """Request body for updating a project's title."""

    title: str


class DeleteResponse(BaseModel):
    """Generic success/failure response."""

    success: bool
    message: str


class ReorderResponse(BaseModel):
    """Response after reordering slides."""

    success: bool
    slides: list[SlideResponse]


class TitleResponse(BaseModel):
    """Response after updating title."""

    success: bool
    title: str
