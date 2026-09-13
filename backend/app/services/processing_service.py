from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.video import Video
from app.models.transcript import Transcript
from app.models.concept import Chapter, Concept
from app.services.youtube_service import YouTubeService
from app.services.transcript_service import TranscriptService
from app.services.chunking_service import ChunkingService
from app.rag.vector_store import RAGVectorStore
from app.ai.gemini import GeminiService

class ProcessingService:
    @classmethod
    async def process_video_url(cls, db: Session, url: str, user_id: Optional[str] = None) -> Video:
        """
        Executes the end-to-end video processing pipeline:
        1. Fetch YouTube Metadata
        2. Fetch Timestamped Transcript
        3. Chunk Transcript & Store Embeddings (RAG Vector Store)
        4. Analyze content via Gemini 2.5 Flash (Summary, Concepts, Chapters)
        5. Persist all structured entities into PostgreSQL / DB
        """
        # 1. Fetch Metadata
        meta = await YouTubeService.get_video_metadata(url)
        
        # Check if video already exists in DB with stale fallback mock data
        existing_video = db.query(Video).filter(Video.youtube_id == meta.youtube_id).first()
        is_stale_fallback = False
        if existing_video:
            title_lower = meta.title.lower()
            if not any(k in title_lower for k in ["recursion", "factorial"]):
                stale_words = ["base case", "call stack", "memoization", "recursion", "tail recursion", "factorial"]
                if existing_video.concepts:
                    for c in existing_video.concepts:
                        if any(w in c.name.lower() for w in stale_words):
                            is_stale_fallback = True
                            break
                if existing_video.key_takeaways and isinstance(existing_video.key_takeaways, dict):
                    takeaways = existing_video.key_takeaways.get("takeaways", [])
                    for t in takeaways:
                        if any(w in t.lower() for w in ["base case", "call stack", "memoization", "recursive"]):
                            is_stale_fallback = True
                            break

        if existing_video and existing_video.summary and len(existing_video.concepts) > 0 and not is_stale_fallback:
            return existing_video

        # 2. Fetch Transcript
        transcript_res = await TranscriptService.get_transcript(meta.youtube_id, meta.title)

        # 3. Create or update Video DB record
        if not existing_video:
            video = Video(
                youtube_id=meta.youtube_id,
                url=meta.url,
                title=meta.title,
                channel=meta.channel,
                thumbnail_url=meta.thumbnail_url,
                duration_seconds=meta.duration_seconds,
                user_id=user_id
            )
            db.add(video)
            db.commit()
            db.refresh(video)
        else:
            video = existing_video
            video.title = meta.title
            video.channel = meta.channel
            video.thumbnail_url = meta.thumbnail_url
            video.duration_seconds = meta.duration_seconds
            db.commit()

        # 4. Save Transcript entity
        db.query(Transcript).filter(Transcript.video_id == video.id).delete()
        transcript_entity = Transcript(
            video_id=video.id,
            full_text=transcript_res.full_text,
            language=transcript_res.language
        )
        db.add(transcript_entity)
        db.commit()

        # 5. Chunk Transcript & Store Embeddings in pgvector / RAG Store
        chunks = ChunkingService.chunk_transcript(transcript_res.segments)
        chunks_data = [
            {
                "chunk_index": c.chunk_index,
                "text": c.text,
                "start_seconds": c.start_seconds,
                "end_seconds": c.end_seconds
            }
            for c in chunks
        ]
        RAGVectorStore.save_transcript_chunks(db, video.id, chunks_data)

        # 6. Analyze via Gemini 2.5 Flash
        ai_result = GeminiService.analyze_transcript(transcript_res.full_text, meta.title)

        # 7. Update Video summary & key takeaways
        video.summary = ai_result.summary
        video.key_takeaways = {"takeaways": ai_result.key_takeaways}

        # 8. Save Chapters
        db.query(Chapter).filter(Chapter.video_id == video.id).delete()
        for ch in ai_result.chapters:
            chapter_obj = Chapter(
                video_id=video.id,
                title=ch.get("title", "Chapter"),
                summary=ch.get("summary", ""),
                start_seconds=float(ch.get("start_seconds", 0.0)),
                end_seconds=float(ch.get("end_seconds", 0.0))
            )
            db.add(chapter_obj)

        # 9. Save Concepts
        db.query(Concept).filter(Concept.video_id == video.id).delete()
        for c in ai_result.concepts:
            concept_obj = Concept(
                video_id=video.id,
                name=c.get("name", "Concept"),
                description=c.get("description", ""),
                timestamp_seconds=float(c.get("timestamp_seconds", 0.0)),
                difficulty=c.get("difficulty", "Medium")
            )
            db.add(concept_obj)

        db.commit()
        db.refresh(video)
        return video
