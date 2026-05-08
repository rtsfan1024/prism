"""Slides API routes."""

import logging

from fastapi import APIRouter, Depends, HTTPException

from api.dependencies import get_slide_service
from api.schemas.slide import (
    CreateSlideRequest,
    DeleteResponse,
    ReorderResponse,
    ReorderSlidesRequest,
    SlideResponse,
    TitleResponse,
    UpdateSlideRequest,
    UpdateTitleRequest,
)
from services.slide_service import SlideService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/slides", tags=["slides"])


@router.get("/projects")
async def list_projects(
    service: SlideService = Depends(get_slide_service),
) -> list[dict]:
    """List all projects with summary info."""
    return service.list_projects()


@router.get("/{slug}")
async def get_slides(
    slug: str,
    service: SlideService = Depends(get_slide_service),
) -> dict:
    """Get all slides for a project (auto-creates if not found)."""
    service.ensure_project(slug)
    project, slides = service.get_slides(slug)

    return {
        "slug": slug,
        "title": project.title,
        "style": _style_dict(project),
        "slides": [s.model_dump() for s in slides],
    }


@router.post("/{slug}", response_model=SlideResponse, status_code=201)
async def create_slide(
    slug: str,
    body: CreateSlideRequest,
    service: SlideService = Depends(get_slide_service),
) -> SlideResponse:
    """Create a new slide in a project (creates project if needed)."""
    return service.create_slide(
        slug=slug,
        content=body.content,
        title=body.title,
        position=body.position,
    )


# NOTE: /reorder and /title must be registered BEFORE /{sid} to avoid path conflicts.


@router.put("/{slug}/reorder", response_model=ReorderResponse)
async def reorder_slides(
    slug: str,
    body: ReorderSlidesRequest,
    service: SlideService = Depends(get_slide_service),
) -> ReorderResponse:
    """Reorder slides in a project."""
    try:
        slides = service.reorder_slides(slug, body.slide_ids)
        return ReorderResponse(success=True, slides=slides)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{slug}/title", response_model=TitleResponse)
async def update_title(
    slug: str,
    body: UpdateTitleRequest,
    service: SlideService = Depends(get_slide_service),
) -> TitleResponse:
    """Update the project title."""
    try:
        new_title = service.update_title(slug, body.title)
        return TitleResponse(success=True, title=new_title)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{slug}/{sid}", response_model=SlideResponse)
async def update_slide(
    slug: str,
    sid: str,
    body: UpdateSlideRequest,
    service: SlideService = Depends(get_slide_service),
) -> SlideResponse:
    """Update a slide's content."""
    try:
        return service.update_slide(slug, sid, body.content)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{slug}/{sid}", response_model=DeleteResponse)
async def delete_slide(
    slug: str,
    sid: str,
    service: SlideService = Depends(get_slide_service),
) -> DeleteResponse:
    """Delete a slide."""
    try:
        service.delete_slide(slug, sid)
        return DeleteResponse(success=True, message="Slide deleted successfully")
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


def _style_dict(project) -> dict | None:
    if project.style is None:
        return None
    return {"prompt": project.style.prompt, "image": project.style.image}
