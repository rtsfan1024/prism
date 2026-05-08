"""FastAPI dependency injection setup."""

from functools import lru_cache

from clients.gemini_client import GeminiClient
from config import settings
from repositories.image_repository import ImageRepository
from repositories.slide_repository import SlideRepository
from services.cost_service import CostService
from services.image_service import ImageService
from services.slide_service import SlideService
from services.style_service import StyleService


@lru_cache
def _get_slide_repo() -> SlideRepository:
    return SlideRepository(base_path=settings.slides_base_path)


@lru_cache
def _get_image_repo() -> ImageRepository:
    return ImageRepository(base_path=settings.slides_base_path)


@lru_cache
def _get_gemini_client() -> GeminiClient:
    return GeminiClient(
        api_key=settings.gemini_api_key,
        model_name=settings.imagen_model_name,
        cost_per_image=settings.imagen_cost_per_image,
    )


def get_slide_service() -> SlideService:
    """Dependency for SlideService."""
    return SlideService(
        slide_repo=_get_slide_repo(),
        image_repo=_get_image_repo(),
    )


def get_image_service() -> ImageService:
    """Dependency for ImageService."""
    return ImageService(
        gemini_client=_get_gemini_client(),
        image_repo=_get_image_repo(),
        slide_repo=_get_slide_repo(),
    )


def get_style_service() -> StyleService:
    """Dependency for StyleService."""
    return StyleService(
        gemini_client=_get_gemini_client(),
        image_repo=_get_image_repo(),
        slide_repo=_get_slide_repo(),
    )


def get_cost_service() -> CostService:
    """Dependency for CostService."""
    return CostService(
        slide_repo=_get_slide_repo(),
        image_repo=_get_image_repo(),
        cost_per_image=settings.imagen_cost_per_image,
    )
