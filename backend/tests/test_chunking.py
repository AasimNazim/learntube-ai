from app.schemas.video import TranscriptSegment
from app.services.chunking_service import ChunkingService

def test_chunking_service_basic():
    segments = [
        TranscriptSegment(text="Hello welcome to the course.", start_seconds=0.0, duration_seconds=3.0),
        TranscriptSegment(text="Today we will learn about recursion in Python.", start_seconds=3.0, duration_seconds=4.0),
        TranscriptSegment(text="A base case is required to prevent infinite loops.", start_seconds=7.0, duration_seconds=5.0),
    ]

    chunks = ChunkingService.chunk_transcript(segments, target_chunk_chars=50, min_chunk_chars=10)

    assert len(chunks) > 0
    assert chunks[0].start_seconds == 0.0
    assert chunks[0].end_seconds >= 3.0
    assert "recursion" in chunks[0].text or "recursion" in "".join(c.text for c in chunks)

def test_chunking_timestamps_preserved():
    segments = [
        TranscriptSegment(text="Line 1 text.", start_seconds=10.0, duration_seconds=5.0),
        TranscriptSegment(text="Line 2 text.", start_seconds=15.0, duration_seconds=5.0),
        TranscriptSegment(text="Line 3 text.", start_seconds=20.0, duration_seconds=5.0),
    ]

    chunks = ChunkingService.chunk_transcript(segments, target_chunk_chars=20, min_chunk_chars=5)
    
    assert chunks[0].start_seconds == 10.0
    assert chunks[-1].end_seconds == 25.0
