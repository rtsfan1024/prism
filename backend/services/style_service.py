"""Style management business logic service."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from clients.gemini_client import GeminiClient

from models.project import Project
from api.schemas.style import (
    GenerateStyleResponse,
    GetStyleResponse,
    SelectStyleResponse,
    StyleCandidate,
    StyleResponse,
)
from models.style import Style
from repositories.image_repository import ImageRepository
from repositories.slide_repository import SlideRepository

logger = logging.getLogger(__name__)


class StyleService:
    """Orchestrates style generation, selection, and retrieval."""

    def __init__(
        self,
        gemini_client: GeminiClient,
        image_repo: ImageRepository,
        slide_repo: SlideRepository,
    ) -> None:
        self.gemini_client = gemini_client
        self.image_repo = image_repo
        self.slide_repo = slide_repo

    def _ensure_project(self, slug: str) -> Project:
        """Get or auto-create a project."""
        project = self.slide_repo.get_project(slug)
        if project is None:
            title = slug.replace("-", " ").replace("_", " ").title()
            project = self.slide_repo.create_project(slug, title)
            logger.info("Auto-created project '%s'", slug)
        return project

    def get_style(self, slug: str) -> GetStyleResponse:
        """Return the current style for a project."""
        project = self._ensure_project(slug)

        if project.style is None:
            return GetStyleResponse(has_style=False, style=None)

        return GetStyleResponse(
            has_style=True,
            style=StyleResponse(
                prompt=project.style.prompt,
                image=project.style.image,
                image_url=f"/api/slides/{slug}/style/{project.style.image}",
            ),
        )

    async def generate_style_candidates(
        self,
        slug: str,
        prompt: str,
    ) -> GenerateStyleResponse:
        """Generate two candidate style images from a prompt."""
        project = self._ensure_project(slug)

        image_data_list = await self.gemini_client.generate_style_candidates(
            prompt=prompt,
            count=2,
        )

        candidates: list[StyleCandidate] = []
        for idx, image_data in enumerate(image_data_list):
            filename = self.image_repo.save_style_image(slug, image_data)
            candidates.append(
                StyleCandidate(
                    filename=filename,
                    url=f"/api/slides/{slug}/style/{filename}",
                )
            )

        # Record cost
        cost = self.gemini_client.cost_per_image * len(image_data_list)
        project.total_cost += cost
        self.slide_repo.save_project(slug, project)

        logger.info(
            "Generated %d style candidates for '%s' (cost: $%.3f)",
            len(candidates),
            slug,
            cost,
        )

        return GenerateStyleResponse(
            candidates=candidates,
            generation_cost=cost,
        )

    def select_style(
        self,
        slug: str,
        prompt: str,
        selected_image: str,
    ) -> SelectStyleResponse:
        """Select a style image and save it as the project's style."""
        project = self._ensure_project(slug)

        # Verify the selected image exists
        img_path = self.image_repo.get_style_image_path(slug, selected_image)
        if img_path is None:
            raise FileNotFoundError(f"Style image '{selected_image}' not found")

        # Save the style reference (the filename stays as-is since it was already
        # saved by save_style_image during generation)
        project.style = Style(prompt=prompt, image=selected_image)
        self.slide_repo.save_project(slug, project)

        logger.info("Selected style for project '%s': %s", slug, selected_image)

        return SelectStyleResponse(
            success=True,
            style=StyleResponse(
                prompt=prompt,
                image=selected_image,
                image_url=f"/api/slides/{slug}/style/{selected_image}",
            ),
        )

    def get_style_image_bytes(self, slug: str, filename: str) -> Optional[bytes]:
        """Read and return raw bytes for a style image.

        Returns None if the file doesn't exist.
        """
        path = self.image_repo.get_style_image_path(slug, filename)
        if path is None or not path.is_file():
            return None
        return path.read_bytes()
