"""Slide data repository — YAML file operations."""

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import yaml

from models.project import Project
from models.slide import Slide
from models.style import Style

logger = logging.getLogger(__name__)


class SlideRepository:
    """Persists project data as outline.yml files on the filesystem."""

    OUTLINE_FILE = "outline.yml"

    def __init__(self, base_path: str = "./slides") -> None:
        self.base_path = Path(base_path)

    def _project_dir(self, slug: str) -> Path:
        return self.base_path / slug

    def _outline_path(self, slug: str) -> Path:
        return self._project_dir(slug) / self.OUTLINE_FILE

    def project_exists(self, slug: str) -> bool:
        """Check whether a project directory and outline file exist."""
        return self._outline_path(slug).is_file()

    def list_projects(self) -> list[dict]:
        """List all projects with summary info."""
        projects: list[dict] = []
        if not self.base_path.is_dir():
            return projects
        for d in sorted(self.base_path.iterdir(), reverse=True):
            if not d.is_dir():
                continue
            outline = d / self.OUTLINE_FILE
            if not outline.is_file():
                continue
            data = yaml.safe_load(outline.read_text(encoding="utf-8"))
            if data is None:
                continue
            projects.append({
                "slug": d.name,
                "title": data.get("title", d.name),
                "slide_count": len(data.get("slides", [])),
                "total_cost": data.get("total_cost", 0.0),
            })
        return projects

    def get_project(self, slug: str) -> Optional[Project]:
        """Load a project from its outline.yml file.

        Returns None if the project does not exist.
        """
        outline = self._outline_path(slug)
        if not outline.is_file():
            return None

        data = yaml.safe_load(outline.read_text(encoding="utf-8"))
        if data is None:
            return None

        style_data = data.get("style")
        style: Optional[Style] = None
        if style_data and style_data.get("prompt"):
            style = Style(
                prompt=style_data["prompt"],
                image=style_data.get("image", ""),
            )

        slides: list[Slide] = []
        for s in data.get("slides", []):
            slides.append(
                Slide(
                    sid=s["sid"],
                    content=s["content"],
                    created_at=_parse_dt(s["created_at"]),
                    updated_at=_parse_dt(s["updated_at"]),
                )
            )

        return Project(
            title=data.get("title", ""),
            style=style,
            slides=slides,
            total_cost=data.get("total_cost", 0.0),
        )

    def save_project(self, slug: str, project: Project) -> None:
        """Write the project state to outline.yml."""
        project_dir = self._project_dir(slug)
        project_dir.mkdir(parents=True, exist_ok=True)

        style_dict: Optional[dict] = None
        if project.style is not None:
            style_dict = {
                "prompt": project.style.prompt,
                "image": project.style.image,
            }

        slides_list: list[dict] = []
        for s in project.slides:
            slides_list.append(
                {
                    "sid": s.sid,
                    "content": s.content,
                    "created_at": s.created_at.isoformat(),
                    "updated_at": s.updated_at.isoformat(),
                }
            )

        data = {
            "title": project.title,
            "style": style_dict,
            "total_cost": project.total_cost,
            "slides": slides_list,
        }

        outline = self._outline_path(slug)
        outline.write_text(
            yaml.dump(data, allow_unicode=True, default_flow_style=False, sort_keys=False),
            encoding="utf-8",
        )
        logger.info("Saved project '%s' with %d slides", slug, len(project.slides))

    def create_project(self, slug: str, title: str) -> Project:
        """Create a new project directory and write its initial outline.

        Raises FileExistsError if the project already exists.
        """
        if self.project_exists(slug):
            raise FileExistsError(f"Project '{slug}' already exists")

        project = Project(title=title, style=None, slides=[], total_cost=0.0)
        self.save_project(slug, project)
        logger.info("Created project '%s'", slug)
        return project

    def delete_project(self, slug: str) -> None:
        """Remove the project directory and all its contents.

        Raises FileNotFoundError if the project does not exist.
        """
        project_dir = self._project_dir(slug)
        if not project_dir.is_dir():
            raise FileNotFoundError(f"Project '{slug}' not found")

        import shutil

        shutil.rmtree(project_dir)
        logger.info("Deleted project '%s'", slug)


def _parse_dt(value: str | datetime) -> datetime:
    """Parse a datetime from a YAML field (string or datetime object)."""
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value
    return datetime.fromisoformat(value)
