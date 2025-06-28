import os
import time

from fastapi import HTTPException
from google import genai
from google.genai import types

from app.core.config import settings


class Text2VideoService:
    def __init__(self):
        self.client = genai.Client()
        self.output_dir = settings.VIDEO_OUTPUT_DIR
        os.makedirs(self.output_dir, exist_ok=True)

    async def generate_video(
        self, prompt: str, aspect_ratio: str, person_generation: str
    ) -> str:
        try:
            operation = self.client.models.generate_videos(
                model=settings.GEMINI_MODEL_VIDEO,
                prompt=prompt,
                config=types.GenerateVideosConfig(
                    person_generation=person_generation,
                    aspect_ratio=aspect_ratio,
                ),
            )

            while not operation.done:
                time.sleep(20)
                operation = self.client.operations.get(operation)

            if not operation.response.generated_videos:
                raise HTTPException(status_code=500, detail="No video generated")

            video = operation.response.generated_videos[0]
            file_path = os.path.join(self.output_dir, f"video_{int(time.time())}.mp4")

            self.client.files.download(file=video.video)
            video.video.save(file_path)

            return file_path

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
