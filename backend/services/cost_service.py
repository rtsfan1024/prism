"""Cost calculation service."""

import logging
from pathlib import Path
from typing import Optional

from api.schemas.cost import CostBreakdown, CostResponse
from repositories.image_repository import ImageRepository
from repositories.slide_repository import SlideRepository

logger = logging.getLogger(__name__)


class CostService:
    """Calculates cost statistics for a project."""

    def __init__(
        self,
        slide_repo: SlideRepository,
        image_repo: ImageRepository,
        cost_per_image: float = 0.134,
    ) -> None:
        self.slide_repo = slide_repo
        self.image_repo = image_repo
        self.cost_per_image = cost_per_image

    def get_cost(self, slug: str) -> CostResponse:
        """Compute and return cost breakdown for a project.

        Raises:
            FileNotFoundError: If the project doesn't exist.
        """
        project = self.slide_repo.get_project(slug)
        if project is None:
            raise FileNotFoundError(f"Project '{slug}' not found")

        # Count slide images
        slide_image_count = 0
        for slide in project.slides:
            images_dir = Path(self.image_repo.base_path) / slug / "images" / slide.sid
            if images_dir.is_dir():
                slide_image_count += sum(
                    1 for f in images_dir.iterdir()
                    if f.is_file() and f.suffix.lower() == ".jpg"
                )

        # Count style images
        style_image_count = 0
        style_dir = Path(self.image_repo.base_path) / slug / "images" / "style"
        if style_dir.is_dir():
            style_image_count = sum(
                1 for f in style_dir.iterdir()
                if f.is_file() and f.suffix.lower() == ".jpg"
            )

        total_image_count = slide_image_count + style_image_count

        # Compute breakdown from actual counts
        slide_cost = slide_image_count * self.cost_per_image
        style_cost = style_image_count * self.cost_per_image

        cost_per_image = self.cost_per_image

        logger.info(
            "Cost for '%s': $%.2f (%d slide images, %d style images)",
            slug,
            project.total_cost,
            slide_image_count,
            style_image_count,
        )

        return CostResponse(
            slug=slug,
            total_cost=project.total_cost,
            currency="USD",
            breakdown=CostBreakdown(
                slide_images=slide_cost,
                style_images=style_cost,
            ),
            image_count=total_image_count,
            cost_per_image=cost_per_image,
        )
