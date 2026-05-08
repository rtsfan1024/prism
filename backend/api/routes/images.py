"""Image API routes."""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from api.dependencies import get_image_service
from api.schemas.image import GenerateImageResponse, ImageInfo, SlideImagesResponse
from pydantic import BaseModel
from services.image_service import ImageService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/slides", tags=["images"])


class GenerateImageRequest(BaseModel):
    """Optional request body for image generation."""

    prompt_override: Optional[str] = None


@router.get("/{slug}/{sid}/images", response_model=SlideImagesResponse)
async def get_slide_images(
    slug: str,
    sid: str,
    service: ImageService = Depends(get_image_service),
) -> SlideImagesResponse:
    """List all images for a slide."""
    try:
        current_hash, images = service.get_slide_images(slug, sid)
        return SlideImagesResponse(
            sid=sid,
            current_content_hash=current_hash,
            images=images,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{slug}/{sid}/images/{filename}")
async def get_image_file(
    slug: str,
    sid: str,
    filename: str,
    service: ImageService = Depends(get_image_service),
) -> Response:
    """Serve a slide image as JPEG bytes."""
    data = service.get_image_bytes(slug, sid, filename)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Image '{filename}' not found")
    return Response(content=data, media_type="image/jpeg")


@router.post("/{slug}/{sid}/generate", response_model=GenerateImageResponse)
async def generate_image(
    slug: str,
    sid: str,
    body: Optional[GenerateImageRequest] = None,
    service: ImageService = Depends(get_image_service),
) -> GenerateImageResponse:
    """Generate a new image for a slide."""
    prompt_override = body.prompt_override if body else None
    try:
        return await service.generate_image(
            slug=slug,
            sid=sid,
            prompt_override=prompt_override,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Image generation failed for '%s/%s': %s", slug, sid, e)
        raise HTTPException(status_code=502, detail=f"Image generation failed: {e}")
