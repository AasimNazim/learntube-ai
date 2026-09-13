import math
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.transcript import TranscriptChunk
from app.ai.embeddings import GeminiEmbeddingService

class SearchResultChunk(BaseModel):
    id: str
    chunk_index: int
    text: str
    start_seconds: float
    end_seconds: float
    similarity: float

class RAGVectorStore:
    @classmethod
    def save_transcript_chunks(
        cls,
        db: Session,
        video_id: str,
        chunks_data: List[Dict[str, Any]]
    ) -> List[TranscriptChunk]:
        """
        Generates embeddings for transcript chunks and saves them to PostgreSQL (pgvector) / SQLite.
        """
        # Delete any pre-existing chunks for this video to allow idempotent re-indexing
        db.query(TranscriptChunk).filter(TranscriptChunk.video_id == video_id).delete()
        db.commit()

        db_chunks: List[TranscriptChunk] = []
        for c in chunks_data:
            text_content = c["text"]
            embedding_vector = GeminiEmbeddingService.generate_embedding(text_content)

            chunk_obj = TranscriptChunk(
                video_id=video_id,
                chunk_index=c["chunk_index"],
                text=text_content,
                start_seconds=c["start_seconds"],
                end_seconds=c["end_seconds"],
                embedding=embedding_vector
            )
            db.add(chunk_obj)
            db_chunks.append(chunk_obj)

        db.commit()
        for chunk in db_chunks:
            db.refresh(chunk)

        return db_chunks

    @classmethod
    def similarity_search(
        cls,
        db: Session,
        video_id: str,
        query: str,
        top_k: int = 5,
        min_similarity: float = -1.0
    ) -> List[SearchResultChunk]:
        """
        Performs semantic similarity search against stored transcript chunks for a video.
        Uses native pgvector (<->) operator when in PostgreSQL, or cosine similarity fallback in SQLite.
        """
        if not query or not query.strip():
            return []

        query_embedding = GeminiEmbeddingService.generate_embedding(query)
        dialect_name = db.bind.dialect.name if db.bind else "sqlite"

        # 1. PostgreSQL native pgvector search if available
        if dialect_name == "postgresql":
            try:
                # pgvector <=> operator is cosine distance
                # Cosine similarity = 1 - cosine_distance
                sql_query = text("""
                    SELECT id, chunk_index, text, start_seconds, end_seconds,
                           (1 - (embedding <=> :query_vec)) AS similarity
                    FROM transcript_chunks
                    WHERE video_id = :video_id
                    ORDER BY embedding <=> :query_vec
                    LIMIT :top_k
                """)
                str_vec = "[" + ",".join(str(x) for x in query_embedding) + "]"
                res = db.execute(sql_query, {
                    "video_id": video_id,
                    "query_vec": str_vec,
                    "top_k": top_k
                }).fetchall()

                results = []
                for row in res:
                    sim = float(row.similarity) if row.similarity is not None else 0.0
                    if sim >= min_similarity:
                        results.append(SearchResultChunk(
                            id=str(row.id),
                            chunk_index=int(row.chunk_index),
                            text=str(row.text),
                            start_seconds=float(row.start_seconds),
                            end_seconds=float(row.end_seconds),
                            similarity=round(sim, 4)
                        ))
                return results
            except Exception:
                pass  # Fall back to in-memory cosine search if pgvector query fails

        # 2. Python Cosine Similarity Search (SQLite / Fallback)
        stored_chunks = db.query(TranscriptChunk).filter(TranscriptChunk.video_id == video_id).all()
        scored_results: List[SearchResultChunk] = []

        for chunk in stored_chunks:
            if not chunk.embedding:
                continue
            
            sim = cls._cosine_similarity(query_embedding, chunk.embedding)
            if sim >= min_similarity:
                scored_results.append(SearchResultChunk(
                    id=chunk.id,
                    chunk_index=chunk.chunk_index,
                    text=chunk.text,
                    start_seconds=chunk.start_seconds,
                    end_seconds=chunk.end_seconds,
                    similarity=round(sim, 4)
                ))

        # Sort descending by similarity
        scored_results.sort(key=lambda x: x.similarity, reverse=True)
        return scored_results[:top_k]

    @staticmethod
    def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = math.sqrt(sum(a * a for a in vec1))
        norm2 = math.sqrt(sum(b * b for b in vec2))
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return dot_product / (norm1 * norm2)
