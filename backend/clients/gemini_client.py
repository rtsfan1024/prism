"""Google GenAI SDK client for image generation.

Supports two API paths automatically based on model name:
- Imagen models (prefix "imagen-"): uses client.models.generate_images()
- Gemini models (prefix "gemini-"): uses client.models.generate_content() with image modality
"""

import asyncio
import logging
from typing import Optional

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


def _is_imagen_model(model_name: str) -> bool:
    """Check if the model is an Imagen model based on name prefix."""
    return model_name.startswith("imagen-")


class GeminiClient:
    """Wraps the Google GenAI SDK for image generation.

    Automatically selects the correct API based on model name:
    - Imagen: generate_images() with GenerateImagesConfig
    - Gemini: generate_content() with GenerateContentConfig(response_modalities=["IMAGE", "TEXT"])
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = "imagen-4.0-fast-generate-001",
        cost_per_image: float = 0.134,
    ) -> None:
        self.model_name = model_name
        self.cost_per_image = cost_per_image
        self._use_imagen = _is_imagen_model(model_name)
        if api_key:
            self.client = genai.Client(api_key=api_key)
        else:
            self.client = genai.Client()

    def _generate_one_imagen(
        self,
        prompt: str,
        aspect_ratio: str = "16:9",
    ) -> bytes:
        """Single image generation via Imagen API."""
        response = self.client.models.generate_images(
            model=self.model_name,
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio=aspect_ratio,
                output_mime_type="image/jpeg",
            ),
        )
        if not response.generated_images:
            raise ValueError("No image generated in response")
        return response.generated_images[0].image.image_bytes

    def _generate_one_gemini(
        self,
        prompt: str,
        aspect_ratio: str = "16:9",
    ) -> bytes:
        """Single image generation via Gemini generate_content API."""
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )
        if not response.candidates:
            raise ValueError("No candidates in response")
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.data:
                return part.inline_data.data
        raise ValueError("No image data found in response parts")

    def _generate_one(
        self,
        prompt: str,
        aspect_ratio: str = "16:9",
    ) -> bytes:
        """Single image generation — routes to Imagen or Gemini API."""
        if self._use_imagen:
            return self._generate_one_imagen(prompt, aspect_ratio)
        return self._generate_one_gemini(prompt, aspect_ratio)

    async def generate_image(
        self,
        prompt: str,
        style_image: Optional[bytes] = None,
    ) -> bytes:
        """Generate an image from a prompt.

        Args:
            prompt: Text description of the desired image.
            style_image: Ignored — not supported by current models.

        Returns:
            Generated image as bytes (JPEG format).
        """
        logger.info("Generating image with %s model: %s", "Imagen" if self._use_imagen else "Gemini", prompt[:80])
        loop = asyncio.get_running_loop()
        image_bytes = await loop.run_in_executor(None, self._generate_one, prompt)
        logger.info("Image generated successfully (%d bytes)", len(image_bytes))
        return image_bytes

    async def generate_style_candidates(
        self,
        prompt: str,
        count: int = 2,
    ) -> list[bytes]:
        """Generate multiple style candidate images from a prompt.

        Args:
            prompt: Style description (e.g. "水彩画风格，柔和的色调").
            count: Number of candidate images to generate.

        Returns:
            List of image byte arrays (JPEG format).
        """
        logger.info("Generating %d style candidates for: %s", count, prompt[:80])
        style_prompt = f"生成一张展示「{prompt}」风格的示例图片，用于作为后续图片生成的风格参考"

        loop = asyncio.get_running_loop()
        tasks = []
        for i in range(count):
            varied_prompt = f"{style_prompt}（变体 {i + 1}）"
            tasks.append(loop.run_in_executor(None, self._generate_one, varied_prompt))

        candidates = await asyncio.gather(*tasks)
        logger.info("Generated %d style candidates", len(candidates))
        return list(candidates)
