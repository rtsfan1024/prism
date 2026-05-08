"""Slide business logic service."""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from api.schemas.slide import SlideResponse
from models.project import Project
from models.slide import Slide
from repositories.image_repository import ImageRepository
from repositories.slide_repository import SlideRepository

logger = logging.getLogger(__name__)


class SlideService:
    """Orchestrates slide CRUD operations across repositories."""

    def __init__(
        self,
        slide_repo: SlideRepository,
        image_repo: ImageRepository,
    ) -> None:
        self.slide_repo = slide_repo
        self.image_repo = image_repo

    def list_projects(self) -> list[dict]:
        """List all projects with summary info."""
        return self.slide_repo.list_projects()

    def get_project(self, slug: str) -> Project:
        """Load a project or raise 404."""
        project = self.slide_repo.get_project(slug)
        if project is None:
            raise FileNotFoundError(f"Project '{slug}' not found")
        return project

    def ensure_project(self, slug: str) -> Project:
        """Get or auto-create a project."""
        project = self.slide_repo.get_project(slug)
        if project is None:
            title = slug.replace("-", " ").replace("_", " ").title()
            project = self.slide_repo.create_project(slug, title)
            logger.info("Auto-created project '%s'", slug)
        return project

    def get_slides(self, slug: str) -> tuple[Project, list[SlideResponse]]:
        """Return the project and its slides enriched with image metadata."""
        project = self.get_project(slug)
        responses: list[SlideResponse] = []
        for slide in project.slides:
            images = self.image_repo.list_images(slug, slide.sid, slide.content_hash)
            matching = [img for img in images if img.is_current]
            responses.append(
                SlideResponse(
                    sid=slide.sid,
                    content=slide.content,
                    content_hash=slide.content_hash,
                    created_at=slide.created_at,
                    updated_at=slide.updated_at,
                    has_matching_image=len(matching) > 0,
                    image_count=len(images),
                )
            )
        return project, responses

    def create_slide(
        self,
        slug: str,
        content: str,
        title: Optional[str] = None,
        position: Optional[int] = None,
    ) -> SlideResponse:
        """Create a slide, creating the project first if it doesn't exist."""
        project = self.slide_repo.get_project(slug)
        if project is None:
            if title is None:
                title = slug.replace("-", " ").replace("_", " ").title()
            project = self.slide_repo.create_project(slug, title)

        now = datetime.now(timezone.utc)
        slide = Slide(
            sid=_generate_sid(),
            content=content,
            created_at=now,
            updated_at=now,
        )

        if position is not None and 0 <= position <= len(project.slides):
            project.slides.insert(position, slide)
        else:
            project.slides.append(slide)

        self.slide_repo.save_project(slug, project)
        logger.info("Created slide %s in project '%s'", slide.sid, slug)

        return SlideResponse(
            sid=slide.sid,
            content=slide.content,
            content_hash=slide.content_hash,
            created_at=slide.created_at,
            updated_at=slide.updated_at,
            has_matching_image=False,
            image_count=0,
        )

    def update_slide(self, slug: str, sid: str, content: str) -> SlideResponse:
        """Update a slide's content. Raises FileNotFoundError if not found."""
        project = self.get_project(slug)
        slide = _find_slide(project, sid)

        slide.content = content
        slide.updated_at = datetime.now(timezone.utc)
        self.slide_repo.save_project(slug, project)
        logger.info("Updated slide %s in project '%s'", sid, slug)

        images = self.image_repo.list_images(slug, slide.sid, slide.content_hash)
        matching = [img for img in images if img.is_current]

        return SlideResponse(
            sid=slide.sid,
            content=slide.content,
            content_hash=slide.content_hash,
            created_at=slide.created_at,
            updated_at=slide.updated_at,
            has_matching_image=len(matching) > 0,
            image_count=len(images),
        )

    def delete_slide(self, slug: str, sid: str) -> None:
        """Remove a slide and its images from the project."""
        project = self.get_project(slug)
        slide = _find_slide(project, sid)
        project.slides.remove(slide)
        self.slide_repo.save_project(slug, project)
        deleted = self.image_repo.delete_slide_images(slug, sid)
        logger.info("Deleted slide %s from project '%s' (%d images removed)", sid, slug, deleted)

    def reorder_slides(self, slug: str, slide_ids: list[str]) -> list[SlideResponse]:
        """Reorder slides according to the given ID list."""
        project = self.get_project(slug)

        id_to_slide = {s.sid: s for s in project.slides}
        if set(slide_ids) != set(id_to_slide.keys()):
            raise ValueError("slide_ids must contain exactly the same IDs as the current slides")

        project.slides = [id_to_slide[sid] for sid in slide_ids]
        self.slide_repo.save_project(slug, project)
        logger.info("Reordered slides in project '%s'", slug)

        responses: list[SlideResponse] = []
        for slide in project.slides:
            images = self.image_repo.list_images(slug, slide.sid, slide.content_hash)
            matching = [img for img in images if img.is_current]
            responses.append(
                SlideResponse(
                    sid=slide.sid,
                    content=slide.content,
                    content_hash=slide.content_hash,
                    created_at=slide.created_at,
                    updated_at=slide.updated_at,
                    has_matching_image=len(matching) > 0,
                    image_count=len(images),
                )
            )
        return responses

    def update_title(self, slug: str, title: str) -> str:
        """Update the project title. Returns the new title."""
        project = self.get_project(slug)
        project.title = title
        self.slide_repo.save_project(slug, project)
        logger.info("Updated title for project '%s'", slug)
        return title


def _generate_sid() -> str:
    """Generate a short unique slide identifier."""
    return f"s_{uuid.uuid4().hex[:8]}"


def _find_slide(project: Project, sid: str) -> Slide:
    """Find a slide by ID or raise FileNotFoundError."""
    for slide in project.slides:
        if slide.sid == sid:
            return slide
    raise FileNotFoundError(f"Slide '{sid}' not found")
