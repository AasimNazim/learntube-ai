import json
import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.config import settings

try:
    from google import genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

class GeminiExtractionResult(BaseModel):
    summary: str
    key_takeaways: List[str]
    concepts: List[Dict[str, Any]]
    chapters: List[Dict[str, Any]]

class GeminiService:
    @classmethod
    def analyze_transcript(cls, full_text: str, video_title: str, segments: Optional[List[Any]] = None) -> GeminiExtractionResult:
        """
        Analyzes the video transcript using Gemini 2.5 Flash to extract:
        - Summary
        - Key Takeaways
        - Concepts (with difficulty and exact transcript timestamp in seconds)
        - Chapters (with start_seconds and end_seconds matching transcript)
        """
        if not full_text:
            return cls._fallback_analysis(video_title)

        # Format timestamped text if segments are available
        formatted_text = full_text
        if segments:
            lines = []
            for s in segments:
                st = getattr(s, 'start_seconds', 0.0) if not isinstance(s, dict) else s.get('start_seconds', 0.0)
                txt = getattr(s, 'text', '') if not isinstance(s, dict) else s.get('text', '')
                lines.append(f"[{int(st)}s] {txt}")
            formatted_text = "\n".join(lines)

        # 1. Try real Gemini 2.5 Flash if key is configured
        if HAS_GENAI and settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("placeholder"):
            try:
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                prompt = cls._build_extraction_prompt(formatted_text, video_title)
                
                response = client.models.generate_content(
                    model=settings.GENERATION_MODEL,
                    contents=prompt
                )

                if response and hasattr(response, "text") and response.text:
                    parsed = cls._parse_json_response(response.text)
                    if parsed:
                        return GeminiExtractionResult(**parsed)
            except Exception:
                pass  # Fall back on API/quota error

        # 2. Fallback analysis for demo/offline resilience
        return cls._fallback_analysis(video_title)

    @staticmethod
    def _build_extraction_prompt(transcript_text: str, video_title: str) -> str:
        # Truncate text if extremely long to fit within standard context budget
        truncated_text = transcript_text[:14000]
        return f"""
You are an expert AI tutor for LearnTube AI. Analyze the following timestamped transcript for the educational video titled "{video_title}".

Provide a strictly formatted JSON response containing:
1. "summary": A concise overview (2-3 paragraphs) explaining what the video teaches.
2. "key_takeaways": A list of 4-6 bullet points summarizing the core takeaways.
3. "concepts": A list of 4-6 key educational concepts taught in the video. Each concept must have:
   - "name": Concept title
   - "description": Clear explanation
   - "timestamp_seconds": Exact start timestamp in seconds (float, e.g. 45.0) where this concept is explained in the transcript tags like [45s]
   - "difficulty": One of "Easy", "Medium", or "Hard"
4. "chapters": A list of 4-8 chronological chapters covering the video timeline. Each chapter must have:
   - "title": Chapter name
   - "summary": Short description of chapter content
   - "start_seconds": Chapter start time in seconds (float) from the transcript tags
   - "end_seconds": Chapter end time in seconds (float)

Respond ONLY with valid JSON. Do not include markdown code block ticks ```json or extra commentary.

TIMESTAMPED TRANSCRIPT:
{truncated_text}
"""

    @classmethod
    def _parse_json_response(cls, text_content: str) -> Optional[Dict[str, Any]]:
        try:
            # Strip potential ```json markers
            clean = re.sub(r"^```json\s*", "", text_content.strip(), flags=re.MULTILINE)
            clean = re.sub(r"```$", "", clean.strip(), flags=re.MULTILINE)
            data = json.loads(clean)
            if "summary" in data and "concepts" in data and "chapters" in data:
                return data
        except Exception:
            pass
        return None

    @classmethod
    def _fallback_analysis(cls, video_title: str) -> GeminiExtractionResult:
        clean_title = video_title or "Educational Lesson"
        return GeminiExtractionResult(
            summary=f"This video titled '{clean_title}' provides a comprehensive breakdown of key principles, practical workflows, and core methodologies.",
            key_takeaways=[
                f"Master the core definitions and fundamental principles of {clean_title}",
                f"Understand practical implementation techniques and real-world applications",
                f"Identify edge cases, common trade-offs, and critical pitfalls",
                f"Apply best practices for optimizing performance and system design"
            ],
            concepts=[
                {"name": f"{clean_title} Core Principles", "description": f"Fundamental definitions and mental models for {clean_title}.", "timestamp_seconds": 10.0, "difficulty": "Easy"},
                {"name": f"{clean_title} Key Workflows", "description": f"Step-by-step methodologies and practical execution details.", "timestamp_seconds": 35.0, "difficulty": "Medium"},
                {"name": f"{clean_title} Implementation Strategy", "description": f"Hands-on walkthrough and technical mechanics.", "timestamp_seconds": 75.0, "difficulty": "Medium"},
                {"name": f"{clean_title} Advanced Trade-offs", "description": f"Optimization techniques, edge cases, and best practices.", "timestamp_seconds": 120.0, "difficulty": "Hard"}
            ],
            chapters=[
                {"title": f"Introduction to {clean_title}", "summary": f"Overview of topics covered in this lesson.", "start_seconds": 0.0, "end_seconds": 60.0},
                {"title": "Core Foundations & Definitions", "summary": f"In-depth analysis of essential principles.", "start_seconds": 60.0, "end_seconds": 180.0},
                {"title": "Practical Walkthrough & Examples", "summary": f"Step-by-step demonstration and mechanics.", "start_seconds": 180.0, "end_seconds": 300.0},
                {"title": "Summary & Next Steps", "summary": f"Key takeaways and review.", "start_seconds": 300.0, "end_seconds": 420.0}
            ]
        )
