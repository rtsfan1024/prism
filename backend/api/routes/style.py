"""Style API routes."""

import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from api.dependencies import get_style_service
from api.schemas.style import (
    GenerateStyleRequest,
    GenerateStyleResponse,
    GetStyleResponse,
    SelectStyleRequest,
    SelectStyleResponse,
)
from services.style_service import StyleService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/slides", tags=["style"])


@router.get("/{slug}/style", response_model=GetStyleResponse)
async def get_style(
    slug: str,
    service: StyleService = Depends(get_style_service),
) -> GetStyleResponse:
    """Get the project's current style configuration."""
    try:
        return service.get_style(slug)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{slug}/style/generate", response_model=GenerateStyleResponse)
async def generate_style_candidates(
    slug: str,
    body: GenerateStyleRequest,
    service: StyleService = Depends(get_style_service),
) -> GenerateStyleResponse:
    """Generate two candidate style images from a prompt."""
    try:
        return await service.generate_style_candidates(slug, body.prompt)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Style generation failed for '%s': %s", slug, e)
        raise HTTPException(status_code=502, detail=f"Image generation failed: {e}")


@router.put("/{slug}/style", response_model=SelectStyleResponse)
async def select_style(
    slug: str,
    body: SelectStyleRequest,
    service: StyleService = Depends(get_style_service),
) -> SelectStyleResponse:
    """Select and save a style for the project."""
    try:
        return service.select_style(slug, body.prompt, body.selected_image)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{slug}/style/{filename}")
async def get_style_image(
    slug: str,
    filename: str,
    service: StyleService = Depends(get_style_service),
) -> Response:
    """Serve a style image as JPEG bytes."""
    data = service.get_style_image_bytes(slug, filename)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Style image '{filename}' not found")
    return Response(content=data, media_type="image/jpeg")
