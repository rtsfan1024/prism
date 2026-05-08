"""Cost API routes."""

import logging

from fastapi import APIRouter, Depends, HTTPException

from api.dependencies import get_cost_service
from api.schemas.cost import CostResponse
from services.cost_service import CostService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cost", tags=["cost"])


@router.get("/{slug}", response_model=CostResponse)
async def get_cost(
    slug: str,
    service: CostService = Depends(get_cost_service),
) -> CostResponse:
    """Get cost statistics for a project."""
    try:
        return service.get_cost(slug)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
