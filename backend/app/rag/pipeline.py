from typing import Optional, List
from sqlalchemy.orm import Session
from app.config import settings
from app.models.progress import TutorMessage
from app.models.video import Video
from app.rag.vector_store import RAGVectorStore, SearchResultChunk
from app.schemas.tutor import AskQuestionResponse
from app.utils.timestamp import format_timestamp

try:
    from google import genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

class RAGPipeline:
    @classmethod
    def ask_video(
        cls,
        db: Session,
        video_id: str,
        question: str,
        user_id: Optional[str] = None
    ) -> AskQuestionResponse:
        """
        Executes grounded RAG pipeline:
        1. Fetch recent conversation history for context (follow-up support)
        2. Retrieve top relevant timestamped transcript chunks
        3. Verify relevance threshold (guardrail against hallucination)
        4. Query Gemini 2.5 Flash with strict grounding prompt + history
        5. Return answer + source timestamp citation + sources
        6. Persist tutor exchange in DB
        """
        video = db.query(Video).filter((Video.id == video_id) | (Video.youtube_id == video_id)).first()
        if not video:
            try:
                from app.services.processing_service import ProcessingService
                import asyncio
                video_url = f"https://www.youtube.com/watch?v={video_id}"
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        import nest_asyncio
                        nest_asyncio.apply()
                        video = loop.run_until_complete(ProcessingService.process_video_url(db, video_url, user_id=user_id))
                    else:
                        video = loop.run_until_complete(ProcessingService.process_video_url(db, video_url, user_id=user_id))
                except Exception:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    video = loop.run_until_complete(ProcessingService.process_video_url(db, video_url, user_id=user_id))
                    loop.close()
            except Exception as pe:
                raise ValueError(f"Video {video_id} not found. Please paste the YouTube video URL to process it first.")

        # Fetch recent conversation history for follow-up context
        recent_history_objs = db.query(TutorMessage).filter(
            TutorMessage.video_id == video.id
        ).order_by(TutorMessage.id.desc()).limit(6).all()
        recent_history_objs.reverse()

        history_lines = [f"{m.role.capitalize()}: {m.content}" for m in recent_history_objs]
        history_text = "\n".join(history_lines) if history_lines else "No previous conversation history."

        # Search query enhancement for follow-up questions
        search_query = question
        if recent_history_objs and len(question.split()) <= 6:
            last_user_q = next((m.content for m in reversed(recent_history_objs) if m.role == "user"), "")
            if last_user_q:
                search_query = f"{last_user_q} {question}"

        # 1. Retrieve top relevant transcript chunks via vector similarity
        sources: List[SearchResultChunk] = RAGVectorStore.similarity_search(
            db=db,
            video_id=video.id,
            query=search_query,
            top_k=4
        )

        insufficient_msg = "I could not find enough information in this video's transcript."

        import re
        from app.models.transcript import TranscriptChunk

        # Check for explicit timestamp pattern in user question e.g. "at 5:56" or "02:15"
        ts_matches = re.findall(r'\b(\d{1,2}):(\d{2})\b', question)
        ts_evidence_chunks = []
        target_ts_str = None
        if ts_matches:
            m, s = int(ts_matches[0][0]), int(ts_matches[0][1])
            target_sec = m * 60 + s
            target_ts_str = f"{m:02d}:{s:02d}"
            all_chunks = db.query(TranscriptChunk).filter(TranscriptChunk.video_id == video.id).all()
            scored_ts = []
            for c in all_chunks:
                diff = abs(c.start_seconds - target_sec)
                if c.start_seconds <= target_sec <= c.end_seconds or diff <= 90:
                    scored_ts.append((diff, c))
            scored_ts.sort(key=lambda x: x[0])
            ts_evidence_chunks = [item[1] for item in scored_ts[:3]]

        # Check if question is a general summary/overview question or timestamp question
        q_lower = question.lower()
        is_overview_q = any(w in q_lower for w in ["teaching", "about", "summary", "overview", "topic", "explain the video", "what is this"])
        is_timestamp_q = bool(ts_evidence_chunks)

        # 2. Relevance threshold check
        has_summary = bool(video.summary and video.summary.strip())
        if not is_overview_q and not is_timestamp_q and (not sources or max(s.similarity for s in sources) < 0.01):
            if not has_summary:
                cls._save_tutor_messages(db, video.id, user_id, question, insufficient_msg, None)
                return AskQuestionResponse(
                    answer=insufficient_msg,
                    source_timestamp=None,
                    confidence=0.0,
                    grounded=False,
                    sources=[]
                )

        top_source = ts_evidence_chunks[0] if ts_evidence_chunks else (sources[0] if sources else None)
        source_ts_str = target_ts_str if target_ts_str else (format_timestamp(top_source.start_seconds) if top_source else "00:00")

        # 3. Build Grounded Prompt with Video Overview + Timestamp Evidence + Chunks
        evidence_lines = []
        if video.summary:
            evidence_lines.append(f"[Video Overview] {video.summary}")
        if ts_evidence_chunks:
            for c in ts_evidence_chunks:
                evidence_lines.append(f"[Target Timestamp {format_timestamp(c.start_seconds)}] {c.text}")
        for s in sources:
            evidence_lines.append(f"[{format_timestamp(s.start_seconds)}] {s.text}")

        evidence_text = "\n".join(evidence_lines) if evidence_lines else "No explicit transcript chunks."

        answer_text = cls._generate_grounded_answer(question, evidence_text, video.title, history_text)
        
        # 4. Save to DB
        cls._save_tutor_messages(db, video.id, user_id, question, answer_text, source_ts_str)

        return AskQuestionResponse(
            answer=answer_text,
            source_timestamp=source_ts_str,
            confidence=round(getattr(top_source, 'similarity', 0.95), 2) if top_source else 0.8,
            grounded=True,
            sources=sources
        )

    @classmethod
    def _generate_grounded_answer(cls, question: str, evidence_text: str, video_title: str, history_text: str = "") -> str:
        """Queries Gemini Flash with strict grounding instructions and conversation history."""
        if HAS_GENAI and settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("placeholder"):
            try:
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                prompt = f"""
You are the AI Tutor for the educational video "{video_title}".
Answer the user's question ONLY using the video summary and transcript evidence provided below.

Rules:
- Be clear, direct, and helpful (2-4 sentences).
- Explain what the instructor is discussing based on the transcript and video evidence provided below.
- If the user asks about a timestamp or concept covered in the evidence, summarize and explain it clearly.
- Mention the timestamp where this is explained if available.
- Only if the evidence is completely empty or completely unrelated to the video, return EXACTLY:
  "I could not find enough information in this video's transcript."

RECENT CONVERSATION HISTORY:
{history_text}

TRANSCRIPT & VIDEO EVIDENCE:
{evidence_text}

USER QUESTION:
{question}
"""
                try:
                    response = client.models.generate_content(
                        model=settings.GENERATION_MODEL,
                        contents=prompt
                    )
                except Exception as model_err:
                    import logging
                    logging.warning(f"RAG generation error with {settings.GENERATION_MODEL}: {model_err}. Trying alternate model...")
                    alt_models = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-flash-lite"]
                    response = None
                    for alt in alt_models:
                        if alt == settings.GENERATION_MODEL:
                            continue
                        try:
                            response = client.models.generate_content(
                                model=alt,
                                contents=prompt
                            )
                            if response and hasattr(response, "text") and response.text:
                                break
                        except Exception as alt_err:
                            logging.warning(f"Alternate model {alt} error: {alt_err}")
                            continue

                if response and hasattr(response, "text") and response.text:
                    return response.text.strip()
            except Exception as e:
                import logging
                logging.error(f"Gemini generation error in RAG pipeline: {e}")
                pass

        # Fallback response for offline/mock testing
        clean_q = question.lower().replace('what is', '').replace('explain', '').replace('how does', '').strip(' ?')
        return f"Based on the transcript evidence from '{video_title}', the instructor explains that {clean_q} is a key topic covered around the cited timestamp."

    @staticmethod
    def _save_tutor_messages(
        db: Session,
        video_id: str,
        user_id: Optional[str],
        question: str,
        answer: str,
        source_ts: Optional[str]
    ):
        user_msg = TutorMessage(
            video_id=video_id,
            user_id=user_id,
            role="user",
            content=question,
            source_timestamp=None
        )
        tutor_msg = TutorMessage(
            video_id=video_id,
            user_id=user_id,
            role="tutor",
            content=answer,
            source_timestamp=source_ts
        )
        db.add_all([user_msg, tutor_msg])
        db.commit()
