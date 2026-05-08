"""Image file repository — manages image files on the filesystem."""

import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from api.schemas.image import ImageInfo

logger = logging.getLogger(__name__)


class ImageRepository:
    """Handles image file storage operations for slides and styles."""

    def __init__(self, base_path: str = "./slides") -> None:
        self.base_path = Path(base_path)

    def _slide_images_dir(self, slug: str, sid: str) -> Path:
        return self.base_path / slug / "images" / sid

    def _style_images_dir(self, slug: str) -> Path:
        return self.base_path / slug / "images" / "style"

    # --- Slide images ---

    def save_image(
        self, slug: str, sid: str, content_hash: str, image_data: bytes
    ) -> str:
        """Save an image file for a slide and return its filename.

        Args:
            slug: Project identifier.
            sid: Slide identifier.
            content_hash: Hash derived from slide content.
            image_data: Raw image bytes.

        Returns:
            The filename (e.g. "abc123def456.jpg").
        """
        images_dir = self._slide_images_dir(slug, sid)
        images_dir.mkdir(parents=True, exist_ok=True)

        filename = f"{content_hash}.jpg"
        filepath = images_dir / filename
        filepath.write_bytes(image_data)
        logger.info("Saved image %s for slide %s/%s", filename, slug, sid)
        return filename

    def get_image_path(
        self, slug: str, sid: str, content_hash: str
    ) -> Optional[Path]:
        """Return the path to an image if it exists, else None."""
        filepath = self._slide_images_dir(slug, sid) / f"{content_hash}.jpg"
        return filepath if filepath.is_file() else None

    def list_images(self, slug: str, sid: str, current_hash: str) -> list[ImageInfo]:
        """List all images for a slide, marking which matches the current hash."""
        images_dir = self._slide_images_dir(slug, sid)
        if not images_dir.is_dir():
            return []

        results: list[ImageInfo] = []
        for f in sorted(images_dir.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
            if not f.is_file() or f.suffix.lower() != ".jpg":
                continue

            file_hash = f.stem
            mtime = datetime.fromtimestamp(f.stat().st_mtime, tz=timezone.utc)
            results.append(
                ImageInfo(
                    filename=f.name,
                    content_hash=file_hash,
                    url=f"/api/slides/{slug}/{sid}/images/{f.name}",
                    is_current=(file_hash == current_hash),
                    created_at=mtime,
                )
            )

        return results

    def delete_image(self, slug: str, sid: str, content_hash: str) -> bool:
        """Delete an image file. Returns True if deleted, False if not found."""
        filepath = self._slide_images_dir(slug, sid) / f"{content_hash}.jpg"
        if filepath.is_file():
            filepath.unlink()
            logger.info("Deleted image %s for slide %s/%s", content_hash, slug, sid)
            return True
        return False

    def delete_slide_images(self, slug: str, sid: str) -> int:
        """Delete all images for a slide. Returns number of files deleted."""
        images_dir = self._slide_images_dir(slug, sid)
        if not images_dir.is_dir():
            return 0
        count = sum(1 for f in images_dir.iterdir() if f.is_file())
        shutil.rmtree(images_dir)
        logger.info("Deleted %d images for slide %s/%s", count, slug, sid)
        return count

    # --- Style images ---

    def save_style_image(self, slug: str, image_data: bytes) -> str:
        """Save a style reference image and return its filename.

        The filename is derived from the hash of the image data.
        """
        import blake3 as _blake3

        style_dir = self._style_images_dir(slug)
        style_dir.mkdir(parents=True, exist_ok=True)

        content_hash = _blake3.blake3(image_data).hexdigest()[:16]
        filename = f"{content_hash}.jpg"
        filepath = style_dir / filename
        filepath.write_bytes(image_data)
        logger.info("Saved style image %s for project %s", filename, slug)
        return filename

    def get_style_image_path(self, slug: str, filename: str) -> Optional[Path]:
        """Return the path to a style image if it exists, else None."""
        filepath = self._style_images_dir(slug) / filename
        return filepath if filepath.is_file() else None

    def list_style_images(self, slug: str) -> list[str]:
        """List all style image filenames for a project."""
        style_dir = self._style_images_dir(slug)
        if not style_dir.is_dir():
            return []
        return [f.name for f in sorted(style_dir.iterdir()) if f.is_file() and f.suffix.lower() == ".jpg"]

    def copy_to_style(self, slug: str, source_slug: str, source_filename: str) -> str:
        """Copy an image from the style candidates area to the canonical style image.

        Returns the new filename in the style directory.
        """
        source = self._style_images_dir(source_slug) / source_filename
        if not source.is_file():
            raise FileNotFoundError(f"Source style image not found: {source_filename}")

        dest_dir = self._style_images_dir(slug)
        dest_dir.mkdir(parents=True, exist_ok=True)

        # Re-derive a clean filename from content
        data = source.read_bytes()
        return self.save_style_image(slug, data)
