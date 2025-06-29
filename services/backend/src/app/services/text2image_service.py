import os
import time
import uuid
from io import BytesIO

from google import genai
from google.genai import types
from loguru import logger
from PIL import Image

from src.app.core.config import settings


class ImageGenerationError(Exception):
    """Custom exception for image generation failures."""


class Text2ImageService:
    """
    Service for generating images from text prompts using the Gemini AI API.

    This service handles the logic for calling the image generation model,
    saving the resulting images to a designated output directory, and
    managing errors related to the generation process.
    """

    def __init__(self):
        """Initializes the Text2ImageService, creating the output directory if needed."""
        self.client = genai.Client()
        self.output_dir = settings.IMAGE_OUTPUT_DIR
        os.makedirs(self.output_dir, exist_ok=True)

    async def generate_images(self, prompt: str, num_images: int) -> list[str]:
        """
        Generates a specified number of images based on a text prompt.

        Args:
            prompt: The text description to generate images from.
            num_images: The number of images to generate.

        Returns:
            A list of filenames for the generated images.

        Raises:
            ImageGenerationError: If the API fails to return images or if any other
                                  unexpected error occurs during the process.
        """
        try:
            logger.info("Requesting %d image(s) for prompt...", num_images)
            response = await self.client.aio.models.generate_images(
                model=settings.GEMINI_MODEL_IMAGE,
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=num_images,
                ),
            )

            if not response.generated_images:
                logger.error("Image generation failed: API returned no images.")
                raise ImageGenerationError(
                    "Image generation failed: The API returned no images."
                )

            file_paths = []
            for generated_image in response.generated_images:
                image = Image.open(BytesIO(generated_image.image.image_bytes))
                # Use UUID for unique filenames
                file_name = f"image_{uuid.uuid4()}.png"
                file_path = os.path.join(self.output_dir, file_name)
                image.save(file_path)
                file_paths.append(file_name)

            logger.info("Successfully generated %d image(s).", len(file_paths))
            return file_paths

        except Exception as e:
            logger.error("An unexpected error occurred in Text2ImageService: %s", e)
            raise ImageGenerationError(f"An unexpected error occurred: {e}") from e
