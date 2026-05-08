"""Application configuration using pydantic-settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    gemini_api_key: str
    slides_base_path: str = "./slides"
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = ["http://localhost:5173"]
    imagen_model_name: str = "imagen-4.0-fast-generate-001"
    imagen_cost_per_image: float = 0.134

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


settings = Settings()
