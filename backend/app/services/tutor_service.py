import json
from typing import List, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models.video import Video
from app.models.transcript import TranscriptChunk
from app.models.progress import TutorMessage
from app.schemas.tutor import SegmentTutorResponse, TutorMessageSchema
from app.utils.timestamp import format_timestamp

try:
    from google import genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

class TutorService:
    @classmethod
    def explain_segment(
        cls,
        db: Session,
        video_id: str,
        start_seconds: float,
        end_seconds: float
    ) -> SegmentTutorResponse:
        """
        Retrieves transcript context for a specific [start_seconds, end_seconds] range
        and uses Gemini 2.5 Flash to provide a grounded segment breakdown.
        """
        video = db.query(Video).filter((Video.id == video_id) | (Video.youtube_id == video_id)).first()
        if not video:
            raise ValueError(f"Video {video_id} not found")

        # Retrieve transcript chunks within timestamp range
        matching_chunks = db.query(TranscriptChunk).filter(
            TranscriptChunk.video_id == video.id,
            TranscriptChunk.end_seconds >= start_seconds,
            TranscriptChunk.start_seconds <= end_seconds
        ).order_by(TranscriptChunk.chunk_index).all()

        segment_text = " ".join(c.text for c in matching_chunks) if matching_chunks else ""
        range_str = f"{format_timestamp(start_seconds)} - {format_timestamp(end_seconds)}"

        explanation, concepts, takeaway = cls._generate_segment_breakdown(
            video.title, range_str, segment_text
        )

        return SegmentTutorResponse(
            video_id=video.id,
            start_seconds=start_seconds,
            end_seconds=end_seconds,
            timestamp_range_formatted=range_str,
            explanation=explanation,
            key_concepts=concepts,
            takeaway=takeaway
        )

    @classmethod
    def get_tutor_history(cls, db: Session, video_id: str) -> List[TutorMessageSchema]:
        """Returns past Q&A tutor message history for a video workspace."""
        video = db.query(Video).filter((Video.id == video_id) | (Video.youtube_id == video_id)).first()
        if not video:
            return []

        messages = db.query(TutorMessage).filter(
            TutorMessage.video_id == video.id
        ).order_by(TutorMessage.created_at.asc()).all()

        return [
            TutorMessageSchema(
                id=m.id,
                role=m.role,
                content=m.content,
                source_timestamp=m.source_timestamp,
                created_at=m.created_at.isoformat()
            )
            for m in messages
        ]

    @classmethod
    def _generate_segment_breakdown(cls, video_title: str, range_str: str, segment_text: str):
        """Uses Gemini 2.5 Flash to break down a selected segment."""
        if HAS_GENAI and settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("placeholder") and segment_text:
            try:
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                prompt = f"""
Analyze this segment ({range_str}) from the video "{video_title}".
Respond ONLY with JSON containing:
1. "explanation": Clear paragraph explaining what this section teaches.
2. "key_concepts": List of 2-3 key concept titles.
3. "takeaway": One key sentence takeaway.

SEGMENT TRANSCRIPT:
{segment_text}
"""
                models_cascade = [
                    settings.GENERATION_MODEL,
                    "gemini-3.5-flash",
                    "gemini-3.5-flash-lite",
                    "gemini-3.1-flash-lite",
                    "gemini-3.6-flash"
                ]
                seen = set()
                unique_models = [m for m in models_cascade if not (m in seen or seen.add(m))]

                for model_name in unique_models:
                    try:
                        resp = client.models.generate_content(
                            model=model_name,
                            contents=prompt
                        )
                        if resp and hasattr(resp, "text") and resp.text:
                            clean = resp.text.strip().replace("```json", "").replace("```", "").strip()
                            data = json.loads(clean)
                            return (
                                data.get("explanation", ""),
                                data.get("key_concepts", []),
                                data.get("takeaway", "")
                            )
                    except Exception:
                        continue
            except Exception:
                pass

        # Fallback segment explanation
        clean_title = video_title or "this topic"
        return (
            f"In this segment ({range_str}), the instructor demonstrates key principles and step-by-step mechanics for {clean_title}.",
            [f"{clean_title} Core Concepts", f"{clean_title} Key Mechanics"],
            f"Review the primary definitions and examples presented in this segment of {clean_title}."
        )
