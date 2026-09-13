from typing import List, Dict, Any
from pydantic import BaseModel
from app.schemas.video import TranscriptSegment

class ChunkItem(BaseModel):
    chunk_index: int
    text: str
    start_seconds: float
    end_seconds: float

class ChunkingService:
    @classmethod
    def chunk_transcript(
        cls,
        segments: List[TranscriptSegment],
        target_chunk_chars: int = 1200,
        min_chunk_chars: int = 400
    ) -> List[ChunkItem]:
        """
        Chunks raw transcript segments into semantic paragraph chunks (~200-400 words / 1000-1500 chars)
        while strictly tracking and preserving start_seconds and end_seconds for each chunk.
        """
        if not segments:
            return []

        chunks: List[ChunkItem] = []
        current_texts: List[str] = []
        current_start: float = segments[0].start_seconds
        current_end: float = segments[0].start_seconds + segments[0].duration_seconds
        current_char_count: int = 0
        chunk_counter: int = 0

        for seg in segments:
            seg_text = seg.text.strip()
            if not seg_text:
                continue

            seg_end = seg.start_seconds + seg.duration_seconds

            # If current buffer is empty, initialize timestamps
            if not current_texts:
                current_start = seg.start_seconds
                current_end = seg_end

            current_texts.append(seg_text)
            current_char_count += len(seg_text) + 1
            current_end = max(current_end, seg_end)

            # Check if chunk reached target size
            if current_char_count >= target_chunk_chars:
                combined_text = " ".join(current_texts)
                chunks.append(ChunkItem(
                    chunk_index=chunk_counter,
                    text=combined_text,
                    start_seconds=round(current_start, 2),
                    end_seconds=round(current_end, 2)
                ))
                chunk_counter += 1
                current_texts = []
                current_char_count = 0

        # Add remaining text buffer as final chunk
        if current_texts:
            combined_text = " ".join(current_texts)
            # If final chunk is tiny and previous chunks exist, merge into previous chunk
            if len(combined_text) < min_chunk_chars and chunks:
                last_chunk = chunks[-1]
                updated_text = last_chunk.text + " " + combined_text
                chunks[-1] = ChunkItem(
                    chunk_index=last_chunk.chunk_index,
                    text=updated_text,
                    start_seconds=last_chunk.start_seconds,
                    end_seconds=round(current_end, 2)
                )
            else:
                chunks.append(ChunkItem(
                    chunk_index=chunk_counter,
                    text=combined_text,
                    start_seconds=round(current_start, 2),
                    end_seconds=round(current_end, 2)
                ))

        return chunks
