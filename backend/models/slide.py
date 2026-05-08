"""Slide domain model."""

from dataclasses import dataclass
from datetime import datetime, timezone

from utils.hash import compute_blake3


@dataclass
class Slide:
    """Represents a single slide in a project."""

    sid: str
    content: str
    created_at: datetime
    updated_at: datetime

    @property
    def content_hash(self) -> str:
        """Compute blake3 hash of the slide content (first 16 hex chars)."""
        return compute_blake3(self.content)

    @staticmethod
    def now() -> datetime:
        """Return the current UTC time."""
        return datetime.now(timezone.utc)
