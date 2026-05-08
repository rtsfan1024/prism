"""Project domain model."""

from dataclasses import dataclass, field
from typing import Optional

from models.slide import Slide
from models.style import Style


@dataclass
class Project:
    """Represents a slide project with title, style, slides, and cost tracking."""

    title: str
    style: Optional[Style]
    slides: list[Slide] = field(default_factory=list)
    total_cost: float = 0.0
