import pytest
from app.services.youtube_service import YouTubeService

def test_extract_video_id_variants():
    # standard watch URL
    url1 = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert YouTubeService.extract_video_id(url1) == "dQw4w9WgXcQ"

    # short URL
    url2 = "https://youtu.be/dQw4w9WgXcQ"
    assert YouTubeService.extract_video_id(url2) == "dQw4w9WgXcQ"

    # embed URL
    url3 = "https://www.youtube.com/embed/dQw4w9WgXcQ"
    assert YouTubeService.extract_video_id(url3) == "dQw4w9WgXcQ"

    # with playlist param
    url4 = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123456"
    assert YouTubeService.extract_video_id(url4) == "dQw4w9WgXcQ"
    assert YouTubeService.extract_playlist_id(url4) == "PL123456"

    # raw ID
    assert YouTubeService.extract_video_id("dQw4w9WgXcQ") == "dQw4w9WgXcQ"

    # invalid URL
    assert YouTubeService.extract_video_id("https://google.com") is None

@pytest.mark.asyncio
async def test_get_video_metadata_service():
    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    metadata = await YouTubeService.get_video_metadata(url)
    
    assert metadata.youtube_id == "dQw4w9WgXcQ"
    assert metadata.title is not None
    assert metadata.url == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert metadata.duration_seconds > 0
