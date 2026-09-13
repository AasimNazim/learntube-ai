import pytest
from app.services.transcript_service import TranscriptService
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.mark.asyncio
async def test_transcript_service():
    video_id = "dQw4w9WgXcQ"
    transcript = await TranscriptService.get_transcript(video_id)

    assert transcript.video_id == video_id
    assert transcript.total_segments > 0
    assert len(transcript.segments) == transcript.total_segments
    assert transcript.full_text != ""
    assert transcript.segments[0].start_seconds >= 0.0

def test_api_video_metadata_endpoint():
    response = client.post(
        "/api/videos/metadata",
        json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["youtube_id"] == "dQw4w9WgXcQ"
    assert "title" in data
    assert "url" in data

def test_api_video_transcript_endpoint():
    response = client.post(
        "/api/videos/transcript",
        json={"video_id": "dQw4w9WgXcQ"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["video_id"] == "dQw4w9WgXcQ"
    assert data["total_segments"] > 0
    assert len(data["segments"]) > 0
