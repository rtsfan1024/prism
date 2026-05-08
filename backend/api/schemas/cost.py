"""Pydantic models for cost API boundaries."""

from pydantic import BaseModel


class CostBreakdown(BaseModel):
    """Breakdown of costs by category."""

    slide_images: float
    style_images: float


class CostResponse(BaseModel):
    """Response with project cost statistics."""

    slug: str
    total_cost: float
    currency: str
    breakdown: CostBreakdown
    image_count: int
    cost_per_image: float
