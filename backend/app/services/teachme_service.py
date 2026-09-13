import json
from typing import Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models.video import Video
from app.models.concept import Concept
from app.schemas.quiz import TeachMeResponse, TeachMeStep, TeachMeQuickCheck

try:
    from google import genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

class TeachMeService:
    @classmethod
    def generate_lesson(cls, db: Session, video_id: str, concept_name: str) -> TeachMeResponse:
        """
        Generates a 3-step progressive lesson + quick understanding check for a target concept.
        """
        video = db.query(Video).filter((Video.id == video_id) | (Video.youtube_id == video_id)).first()
        if not video:
            raise ValueError(f"Video {video_id} not found")

        concept_obj = db.query(Concept).filter(
            Concept.video_id == video.id,
            Concept.name.ilike(f"%{concept_name}%")
        ).first()

        concept_desc = concept_obj.description if concept_obj else ""

        # 1. Try Gemini 2.5 Flash if key available
        if HAS_GENAI and settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("placeholder"):
            try:
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                prompt = f"""
You are an expert computer science AI Tutor creating a "Teach Me" session for the concept "{concept_name}" from the video "{video.title}".
Context: {concept_desc}

Respond ONLY with valid JSON containing:
1. "steps": A list of 3 progressive steps:
   - Step 1: "Understand the Idea" (simple mental model/analogy)
   - Step 2: "See an Example" (clear code snippet or concrete example)
   - Step 3: "Understand How It Works" (step-by-step execution breakdown)
   Each step object must have "label" (string) and "content" (string).
2. "quick_check": A multiple-choice question object:
   - "prompt": Question string testing comprehension
   - "options": Array of 4 option strings
   - "correct_option_index": Integer index (0-3) of the correct answer
   - "explanation": Brief explanation why it is correct.
"""
                resp = client.models.generate_content(
                    model=settings.GENERATION_MODEL,
                    contents=prompt
                )
                if resp and hasattr(resp, "text") and resp.text:
                    clean = resp.text.strip().replace("```json", "").replace("```", "").strip()
                    data = json.loads(clean)
                    if "steps" in data and "quick_check" in data:
                        steps = [TeachMeStep(label=s["label"], content=s["content"]) for s in data["steps"]]
                        qc = TeachMeQuickCheck(**data["quick_check"])
                        return TeachMeResponse(
                            video_id=video.id,
                            concept=concept_name,
                            steps=steps,
                            quick_check=qc
                        )
            except Exception:
                pass

        # Fallback structured lesson
        return cls._fallback_teachme(video.id, concept_name)

    @classmethod
    def _fallback_teachme(cls, video_id: str, concept_name: str) -> TeachMeResponse:
        steps = [
            TeachMeStep(
                label="Understand the Idea",
                content=f"{concept_name} is a key topic covered in this video. It provides essential principles and structure for mastering the material."
            ),
            TeachMeStep(
                label="Core Implementation",
                content=f"When applying {concept_name}, focus on core definitions, inputs/outputs, and step-by-step logic demonstrated in the video transcript."
            ),
            TeachMeStep(
                label="Execution & Practice",
                content=f"Step 1: Identify where {concept_name} occurs in the timeline.\nStep 2: Review key takeaways.\nStep 3: Test your understanding using the practice quiz."
            )
        ]
        qc = TeachMeQuickCheck(
            prompt=f"What is the primary objective of understanding {concept_name}?",
            options=[
                f"To master key principles of {concept_name}",
                "To optimize performance and structure",
                "To build grounded technical knowledge",
                "All of the above"
            ],
            correct_option_index=3,
            explanation=f"Mastering {concept_name} accomplishes all of these core objectives."
        )
        return TeachMeResponse(
            video_id=video_id,
            concept=concept_name,
            steps=steps,
            quick_check=qc
        )
