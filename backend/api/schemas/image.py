"""Pydantic models for image API boundaries."""

from datetime import datetime

from pydantic import BaseModel


class ImageInfo(BaseModel):
    """Metadata for a single image file."""

    filename: str
    content_hash: str
    url: str
    is_current: bool
    created_at: datetime


class SlideImagesResponse(BaseModel):
    """Response listing all images for a slide."""

    sid: str
    current_content_hash: str
    images: list[ImageInfo]


class GenerateImageResponse(BaseModel):
    """Response after generating a new image for a slide."""

    image: ImageInfo
    generation_cost: float
