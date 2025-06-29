import os
import time
from io import BytesIO

from fastapi import HTTPException
from google import genai
from google.genai import types
from PIL import Image

from src.app.core.config import settings


class Text2ImageService:
    def __init__(self):
        self.client = genai.Client()
        self.output_dir = settings.IMAGE_OUTPUT_DIR
        os.makedirs(self.output_dir, exist_ok=True)

    async def generate_images(self, prompt: str, num_images: int) -> list[str]:
        try:
            response = self.client.models.generate_images(
                model=settings.GEMINI_MODEL_IMAGE,
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=num_images,
                ),
            )

            if not response.generated_images:
                raise HTTPException(status_code=500, detail="No images generated")

            file_paths = []
            for i, generated_image in enumerate(response.generated_images):
                image = Image.open(BytesIO(generated_image.image.image_bytes))
                file_path = os.path.join(
                    self.output_dir, f"image_{int(time.time())}_{i}.png"
                )
                image.save(file_path)
                file_paths.append(file_path)

            return file_paths

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
