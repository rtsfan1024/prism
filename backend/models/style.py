"""Style domain model."""

from dataclasses import dataclass


@dataclass
class Style:
    """Represents the visual style configuration for a project."""

    prompt: str
    image: str
