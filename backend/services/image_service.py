"""Image generation business logic service."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from clients.gemini_client import GeminiClient

from api.schemas.image import GenerateImageResponse, ImageInfo
from repositories.image_repository import ImageRepository
from repositories.slide_repository import SlideRepository
from services.slide_service import SlideService

logger = logging.getLogger(__name__)


class ImageService:
    """Orchestrates image generation and retrieval."""

    def __init__(
        self,
        gemini_client: GeminiClient,
        image_repo: ImageRepository,
        slide_repo: SlideRepository,
    ) -> None:
        self.gemini_client = gemini_client
        self.image_repo = image_repo
        self.slide_repo = slide_repo

    async def generate_image(
        self,
        slug: str,
        sid: str,
        prompt_override: Optional[str] = None,
    ) -> GenerateImageResponse:
        """Generate a new image for a slide using the project's style.

        Args:
            slug: Project identifier.
            sid: Slide identifier.
            prompt_override: Optional additional prompt text.

        Returns:
            GenerateImageResponse with the new image metadata and cost.

        Raises:
            FileNotFoundError: If the project or slide doesn't exist.
        """
        project = self.slide_repo.get_project(slug)
        if project is None:
            raise FileNotFoundError(f"Project '{slug}' not found")

        slide = None
        for s in project.slides:
            if s.sid == sid:
                slide = s
                break
        if slide is None:
            raise FileNotFoundError(f"Slide '{sid}' not found in project '{slug}'")

        # Build the prompt — skip the first line (title), use the rest as image prompt
        content_lines = slide.content.split("\n")
        prompt = "\n".join(content_lines[1:]).strip() if len(content_lines) > 1 else slide.content
        if prompt_override:
            prompt = f"{prompt} {prompt_override}"
        if project.style and project.style.prompt:
            prompt = f"{project.style.prompt}，{prompt}"

        # Generate the image
        image_data = await self.gemini_client.generate_image(prompt=prompt)

        # Save and record
        content_hash = slide.content_hash
        filename = self.image_repo.save_image(slug, sid, content_hash, image_data)

        # Update cost
        project.total_cost += self.gemini_client.cost_per_image
        self.slide_repo.save_project(slug, project)

        image_info = ImageInfo(
            filename=filename,
            content_hash=content_hash,
            url=f"/api/slides/{slug}/{sid}/images/{filename}",
            is_current=True,
            created_at=slide.updated_at,
        )

        logger.info("Generated image for slide %s/%s (cost: $%.3f)", slug, sid, self.gemini_client.cost_per_image)

        return GenerateImageResponse(
            image=image_info,
            generation_cost=self.gemini_client.cost_per_image,
        )

    def get_slide_images(self, slug: str, sid: str) -> tuple[str, list[ImageInfo]]:
        """Return the current content hash and all images for a slide.

        Raises:
            FileNotFoundError: If the project or slide doesn't exist.
        """
        project = self.slide_repo.get_project(slug)
        if project is None:
            raise FileNotFoundError(f"Project '{slug}' not found")

        slide = None
        for s in project.slides:
            if s.sid == sid:
                slide = s
                break
        if slide is None:
            raise FileNotFoundError(f"Slide '{sid}' not found in project '{slug}'")

        images = self.image_repo.list_images(slug, sid, slide.content_hash)
        return slide.content_hash, images

    def get_image_bytes(self, slug: str, sid: str, filename: str) -> Optional[bytes]:
        """Read and return raw image bytes for a slide image.

        Returns None if the file doesn't exist.
        """
        content_hash = filename.replace(".jpg", "")
        path = self.image_repo.get_image_path(slug, sid, content_hash)
        if path is None or not path.is_file():
            return None
        return path.read_bytes()
