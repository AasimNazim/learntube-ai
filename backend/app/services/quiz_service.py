import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models.video import Video
from app.models.concept import Concept
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt
from app.models.progress import LearningGap
from app.models.transcript import Transcript
from app.schemas.quiz import (
    QuizSchema,
    QuizQuestionSchema,
    QuizSubmitResponse,
    QuestionResultItem,
    ReviewRecommendationSchema,
    AdaptiveQuizRequest
)
from app.utils.timestamp import format_timestamp

try:
    from google import genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

class QuizService:
    @classmethod
    def get_or_create_quiz(cls, db: Session, video_id: str) -> QuizSchema:
        """
        Retrieves existing quiz or uses Gemini to generate a video-specific quiz with 5-10 questions depending on length/concepts.
        """
        video = db.query(Video).filter((Video.id == video_id) | (Video.youtube_id == video_id)).first()
        if not video:
            raise ValueError(f"Video {video_id} not found")

        # Always set 5 MCQs per user requirement
        target_count = 5

        existing_quiz = db.query(Quiz).filter(Quiz.video_id == video.id).first()
        if existing_quiz and len(existing_quiz.questions) >= 5:
            # Validate existing quiz questions are non-repetitive
            valid_existing = cls._validate_and_deduplicate_questions([
                {
                    "concept_name": q.concept_name,
                    "prompt": q.prompt,
                    "options": q.options,
                    "correct_option_index": q.correct_option_index,
                    "explanation": q.explanation,
                    "source_timestamp": q.source_timestamp
                }
                for q in existing_quiz.questions
            ])
            if len(valid_existing) >= 5:
                # Return strictly 5 questions
                quiz_schema = cls._to_quiz_schema(existing_quiz)
                quiz_schema.questions = quiz_schema.questions[:5]
                return quiz_schema

        # Retrieve video transcript text for grounding
        t_rec = db.query(Transcript).filter(Transcript.video_id == video.id).first()
        transcript_text = t_rec.full_text if t_rec else ""

        if existing_quiz:
            db.query(QuizQuestion).filter(QuizQuestion.quiz_id == existing_quiz.id).delete()
            quiz_obj = existing_quiz
        else:
            quiz_obj = Quiz(video_id=video.id, title=f"{video.title} Quiz")
            db.add(quiz_obj)
            db.commit()
            db.refresh(quiz_obj)

        raw_questions = cls._generate_quiz_questions_ai(
            title=video.title,
            concepts=video.concepts,
            summary=video.summary or "",
            transcript_text=transcript_text,
            count=target_count
        )
        for q in raw_questions:
            q_entity = QuizQuestion(
                quiz_id=quiz_obj.id,
                concept_name=q.get("concept_name", "General Concept"),
                prompt=q.get("prompt", "Question"),
                options=q.get("options", ["A", "B", "C", "D"]),
                correct_option_index=int(q.get("correct_option_index", 0)),
                explanation=q.get("explanation", ""),
                source_timestamp=q.get("source_timestamp", "00:00")
            )
            db.add(q_entity)

        db.commit()
        db.refresh(quiz_obj)
        return cls._to_quiz_schema(quiz_obj)

    @classmethod
    def evaluate_quiz_submission(
        cls,
        db: Session,
        video_id: str,
        quiz_id: str,
        user_answers: List[int],
        user_id: Optional[str] = None
    ) -> QuizSubmitResponse:
        """
        Grades submitted quiz answers, records quiz attempt, detects learning gaps, and generates recommendations.
        """
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise ValueError(f"Quiz {quiz_id} not found")

        questions = quiz.questions
        total_q = len(questions)
        correct_count = 0

        concept_correct: Dict[str, int] = {}
        concept_total: Dict[str, int] = {}
        results_breakdown: List[QuestionResultItem] = []

        for i, q in enumerate(questions):
            c_name = q.concept_name
            concept_total[c_name] = concept_total.get(c_name, 0) + 1

            user_choice = int(user_answers[i]) if i < len(user_answers) and user_answers[i] is not None else -1
            is_correct = (user_choice == q.correct_option_index)

            if is_correct:
                correct_count += 1
                concept_correct[c_name] = concept_correct.get(c_name, 0) + 1
            else:
                # Update Learning Gap DB entity
                cls._record_learning_gap(db, quiz.video_id, user_id, c_name)

            results_breakdown.append(QuestionResultItem(
                question_id=q.id,
                concept_name=q.concept_name,
                prompt=q.prompt,
                user_answer_index=user_choice,
                correct_option_index=q.correct_option_index,
                is_correct=is_correct,
                explanation=q.explanation,
                source_timestamp=q.source_timestamp
            ))

        score_pct = round((correct_count / total_q) * 100.0, 1) if total_q > 0 else 0.0
        score_label = "Excellent" if score_pct >= 80 else "Good Progress" if score_pct >= 60 else "Needs Work"

        strong_concepts = []
        weak_concepts = []
        recommendations: List[ReviewRecommendationSchema] = []

        for c_name, tot in concept_total.items():
            corr = concept_correct.get(c_name, 0)
            pct = (corr / tot) * 100.0
            if pct >= 75.0:
                strong_concepts.append(c_name)
            else:
                weak_concepts.append(c_name)
                # Find timestamp for weak concept
                c_obj = db.query(Concept).filter(Concept.video_id == quiz.video_id, Concept.name == c_name).first()
                ts_str = format_timestamp(c_obj.timestamp_seconds) if c_obj and c_obj.timestamp_seconds else "09:10"
                recommendations.append(ReviewRecommendationSchema(
                    concept=c_name,
                    section=f"{c_name} Deep Dive",
                    source_timestamp=ts_str,
                    reason=f"You scored {int(pct)}% on {c_name} questions."
                ))

        # Record QuizAttempt DB entity
        attempt = QuizAttempt(
            quiz_id=quiz.id,
            user_id=user_id,
            score=score_pct,
            total_questions=total_q
        )
        db.add(attempt)
        db.commit()

        return QuizSubmitResponse(
            attempt_id=attempt.id,
            score_percent=score_pct,
            total_questions=total_q,
            correct_count=correct_count,
            score_label=score_label,
            strong_concepts=strong_concepts,
            weak_concepts=weak_concepts,
            results_breakdown=results_breakdown,
            recommendations=recommendations
        )

    @classmethod
    def generate_adaptive_practice(cls, db: Session, video_id: str, concept_name: str) -> List[QuizQuestionSchema]:
        """Generates targeted practice questions focused on weak concepts."""
        video = db.query(Video).filter((Video.id == video_id) | (Video.youtube_id == video_id)).first()
        title = video.title if video else f"Adaptive Practice: {concept_name}"
        raw_questions = cls._generate_quiz_questions_ai(title, [], concept_name, count=3)
        return [
            QuizQuestionSchema(
                id=f"adaptive_{i}",
                concept_name=q.get("concept_name", concept_name),
                prompt=q.get("prompt", "Question"),
                options=q.get("options", ["A", "B", "C", "D"]),
                correct_option_index=int(q.get("correct_option_index", 0)),
                explanation=q.get("explanation", ""),
                source_timestamp=q.get("source_timestamp", "09:42")
            )
            for i, q in enumerate(raw_questions)
        ]

    @staticmethod
    def _record_learning_gap(db: Session, video_id: str, user_id: Optional[str], concept_name: str):
        gap = db.query(LearningGap).filter(
            LearningGap.video_id == video_id,
            LearningGap.concept_name == concept_name
        ).first()

        if gap:
            gap.missed_count += 1
            gap.severity = "high" if gap.missed_count >= 2 else "medium"
        else:
            gap = LearningGap(
                video_id=video_id,
                user_id=user_id,
                concept_name=concept_name,
                severity="medium",
                missed_count=1
            )
            db.add(gap)
        db.commit()

    @staticmethod
    def _to_quiz_schema(quiz: Quiz) -> QuizSchema:
        return QuizSchema(
            id=quiz.id,
            video_id=quiz.video_id,
            title=quiz.title,
            questions=[
                QuizQuestionSchema(
                    id=q.id,
                    concept_name=q.concept_name,
                    prompt=q.prompt,
                    options=q.options,
                    correct_option_index=int(q.correct_option_index or 0),
                    explanation=q.explanation,
                    source_timestamp=q.source_timestamp
                )
                for q in quiz.questions
            ]
        )

    @classmethod
    def _generate_quiz_questions_ai(
        cls,
        title: str,
        concepts: List[Concept],
        summary: str,
        transcript_text: str = "",
        count: int = 5
    ) -> List[Dict[str, Any]]:
        """Uses Gemini 2.5 Flash to generate grounded, non-repetitive, video-specific multiple choice questions."""
        valid_questions: List[Dict[str, Any]] = []

        if HAS_GENAI and settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("placeholder"):
            try:
                client = genai.Client(api_key=settings.GEMINI_API_KEY)

                concept_snippets = []
                for c in concepts:
                    ts_formatted = format_timestamp(c.timestamp_seconds) if c.timestamp_seconds else "00:00"
                    concept_snippets.append(f"- Concept: '{c.name}' (at {ts_formatted}): {c.description}")
                concepts_str = "\n".join(concept_snippets) if concept_snippets else "Core concepts covered in lesson."

                transcript_excerpt = transcript_text[:3500] if transcript_text else "Transcript content of video."

                prompt = f"""
You are an expert educational AI tutor creating a high-quality assessment quiz for the video titled "{title}".

Video Context:
- Summary: {summary[:500] if summary else 'General educational topic'}
- Key Concepts:
{concepts_str}
- Video Transcript Excerpt:
"{transcript_excerpt}"

TASK:
Generate EXACTLY {count} unique, video-specific multiple choice questions testing fundamental topics taught in this video (e.g. "What is a variable in Python?", "Which data type is used for text?").

STRICT RULES FOR QUIZ QUALITY:
1. Every question MUST be simple, clear, direct, and grounded strictly in the video transcript and concepts above.
2. DO NOT append the full video title inside question prompts or options! Keep prompts clean and natural.
3. Every answer option (A, B, C, D) MUST be distinct, realistic, plausible, and directly related to the programming/educational content of the video.
4. ABSOLUTELY DO NOT use generic boilerplate options like 'legacy configuration flag', 'streaming sockets across microservices', or 'network requests'.
5. Vary the correct_option_index across 0, 1, 2, and 3 across different questions.
6. Provide a clear, informative explanation for why the correct option is right based on the video context.
7. Include an accurate source_timestamp (e.g., "05:56" or "02:15") indicating where in the video this topic was explained.

Respond ONLY with a JSON array of question objects matching this exact structure:
[
  {{
    "concept_name": "Variables & Data Types",
    "prompt": "What is the main purpose of a variable in Python?",
    "options": [
      "To store data values in memory for reuse",
      "To run external shell commands",
      "To delete files from the disk",
      "To compile Python into C code"
    ],
    "correct_option_index": 0,
    "explanation": "Variables act as containers to store data values in memory.",
    "source_timestamp": "02:15"
  }}
]
"""
                try:
                    resp = client.models.generate_content(
                        model=settings.GENERATION_MODEL,
                        contents=prompt
                    )
                except Exception as model_err:
                    import logging
                    logging.warning(f"Quiz generation error with {settings.GENERATION_MODEL}: {model_err}. Trying alternate model...")
                    alt_model = "gemini-flash-latest" if settings.GENERATION_MODEL != "gemini-flash-latest" else "gemini-3.5-flash-lite"
                    resp = client.models.generate_content(
                        model=alt_model,
                        contents=prompt
                    )

                if resp and hasattr(resp, "text") and resp.text:
                    clean = resp.text.strip().replace("```json", "").replace("```", "").strip()
                    data = json.loads(clean)
                    if isinstance(data, list) and len(data) > 0:
                        valid_questions = cls._validate_and_deduplicate_questions(data)
            except Exception:
                pass

        if len(valid_questions) >= count:
            return valid_questions[:count]

        # Generate clean, concept-specific fallback questions for any remaining slots
        fallback_questions = cls._generate_concept_fallback_questions(title, concepts, summary, count - len(valid_questions))
        combined = valid_questions + fallback_questions
        return cls._validate_and_deduplicate_questions(combined)[:count]

    @classmethod
    def _validate_and_deduplicate_questions(cls, questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filters out duplicate questions and repetitive options."""
        clean_questions: List[Dict[str, Any]] = []
        seen_prompts = set()

        for q in questions:
            prompt_text = q.get("prompt", "").strip()
            if not prompt_text:
                continue

            # Normalize prompt text for duplicate detection
            norm_prompt = "".join(e for e in prompt_text.lower() if e.isalnum())
            if norm_prompt in seen_prompts:
                continue

            options = q.get("options", [])
            if not isinstance(options, list) or len(options) < 4:
                continue

            # Ensure all 4 options within the question are distinct
            norm_options = ["".join(e for e in str(opt).lower() if e.isalnum()) for opt in options[:4]]
            if len(set(norm_options)) < 4:
                continue

            # Ensure correct option index is valid
            c_idx = q.get("correct_option_index", 0)
            try:
                c_idx = int(c_idx)
                if c_idx < 0 or c_idx >= 4:
                    c_idx = 0
            except Exception:
                c_idx = 0

            seen_prompts.add(norm_prompt)
            clean_questions.append({
                "concept_name": q.get("concept_name", "Core Concept"),
                "prompt": prompt_text,
                "options": [str(opt).strip() for opt in options[:4]],
                "correct_option_index": c_idx,
                "explanation": q.get("explanation", "Review the video transcript for details."),
                "source_timestamp": q.get("source_timestamp", "01:00")
            })

        return clean_questions

    @classmethod
    def _generate_concept_fallback_questions(
        cls,
        title: str,
        concepts: List[Concept],
        summary: str,
        count: int
    ) -> List[Dict[str, Any]]:
        """Generates clean, concept-specific fallback questions when AI API is unreachable."""
        fallback_list = []
        available_concepts = list(concepts) if concepts else []

        for i in range(count):
            if i < len(available_concepts):
                c = available_concepts[i]
                c_name = c.name
                c_desc = c.description or "Core programming topic."
                c_ts = format_timestamp(c.timestamp_seconds) if c.timestamp_seconds else f"0{i+1}:30"
            else:
                c_name = f"Concept {i+1}"
                c_desc = "Key topic taught in this video."
                c_ts = f"0{i+1}:45"

            correct_idx = i % 4

            if i % 3 == 0:
                prompt_str = f"What is the main purpose of '{c_name}' in Python?"
                opt_a = f"{c_name} defines key logic: {c_desc}"
                opt_b = f"{c_name} is used only to clear terminal output."
                opt_c = f"{c_name} deletes inactive variable references automatically."
                opt_d = f"{c_name} converts all code into HTML markup."
                raw_options = [opt_a, opt_b, opt_c, opt_d]
                correct_opt = opt_a
            elif i % 3 == 1:
                prompt_str = f"Which of the following best describes '{c_name}' in this lesson?"
                opt_a = f"It modifies system environment variables globally."
                opt_b = f"It focuses on {c_desc} to build foundational understanding."
                opt_c = f"It bypasses standard type checking rules completely."
                opt_d = f"It formats error messages into JSON files."
                raw_options = [opt_a, opt_b, opt_c, opt_d]
                correct_opt = opt_b
            else:
                prompt_str = f"Why is understanding '{c_name}' important when learning Python?"
                opt_a = f"Because it causes syntax errors in every Python script."
                opt_b = f"Because it disables standard memory management."
                opt_c = f"Because it provides key principles ({c_desc}) required for writing correct code."
                opt_d = f"Because it is required to install third-party packages."
                raw_options = [opt_a, opt_b, opt_c, opt_d]
                correct_opt = opt_c

            distractors = [o for o in raw_options if o != correct_opt]
            final_options = distractors[:3]
            final_options.insert(correct_idx, correct_opt)

            fallback_list.append({
                "concept_name": c_name,
                "prompt": prompt_str,
                "options": final_options,
                "correct_option_index": correct_idx,
                "explanation": f"{c_name} is explained as: {c_desc}",
                "source_timestamp": c_ts
            })

        return fallback_list
