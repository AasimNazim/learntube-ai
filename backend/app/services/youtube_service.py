import re
import urllib.parse
import httpx
from typing import Optional, Dict, Any
from app.config import settings
from app.schemas.video import VideoMetadataResponse

class YouTubeService:
    @staticmethod
    def extract_video_id(url_or_id: str) -> Optional[str]:
        """
        Extracts 11-character YouTube video ID from various URL formats or raw ID.
        """
        if not url_or_id:
            return None
            
        url_or_id = url_or_id.strip()
        
        # Raw 11-character ID check
        if re.match(r"^[a-zA-Z0-9_-]{11}$", url_or_id):
            return url_or_id
            
        # Parse URL
        parsed = urllib.parse.urlparse(url_or_id)
        
        if "youtube.com" in parsed.netloc:
            if parsed.path == "/watch":
                query = urllib.parse.parse_qs(parsed.query)
                if "v" in query and query["v"]:
                    return query["v"][0]
            elif parsed.path.startswith("/embed/"):
                parts = parsed.path.split("/")
                if len(parts) >= 3:
                    return parts[2]
            elif parsed.path.startswith("/v/"):
                parts = parsed.path.split("/")
                if len(parts) >= 3:
                    return parts[2]
        elif "youtu.be" in parsed.netloc:
            path = parsed.path.lstrip("/")
            if path:
                # Remove query params if attached to short URL
                return path.split("?")[0]

        # Regex fallback search
        match = re.search(r"(?:v=|\/|be\/)([a-zA-Z0-9_-]{11})", url_or_id)
        if match:
            return match.group(1)

        return None

    @staticmethod
    def extract_playlist_id(url: str) -> Optional[str]:
        """Extracts playlist ID if present in the URL."""
        if not url:
            return None
        parsed = urllib.parse.urlparse(url.strip())
        query = urllib.parse.parse_qs(parsed.query)
        if "list" in query and query["list"]:
            return query["list"][0]
        return None

    @classmethod
    async def get_video_metadata(cls, url_or_id: str) -> VideoMetadataResponse:
        """
        Fetches video metadata. Uses YouTube Data API v3 if key available,
        falling back to YouTube public oEmbed API (free, no key required).
        """
        video_id = cls.extract_video_id(url_or_id)
        if not video_id:
            raise ValueError(f"Invalid YouTube URL or Video ID: {url_or_id}")

        canonical_url = f"https://www.youtube.com/watch?v={video_id}"

        # 1. Try YouTube Data API v3 if real key is configured
        if settings.YOUTUBE_API_KEY and not settings.YOUTUBE_API_KEY.startswith("placeholder"):
            try:
                metadata = await cls._fetch_via_data_api(video_id)
                if metadata:
                    return metadata
            except Exception:
                pass  # Fall back to oEmbed on API failure

        # 2. Free No-API-Key Fallback: YouTube oEmbed API
        try:
            metadata = await cls._fetch_via_oembed(video_id, canonical_url)
            if metadata:
                return metadata
        except Exception:
            pass

        # 3. Fallback default metadata for demo/offline resilience
        return VideoMetadataResponse(
            youtube_id=video_id,
            url=canonical_url,
            title=f"YouTube Video ({video_id})",
            channel="YouTube Content Creator",
            thumbnail_url=f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
            duration_seconds=300.0
        )

    @classmethod
    async def _fetch_via_data_api(cls, video_id: str) -> Optional[VideoMetadataResponse]:
        api_url = (
            f"https://www.googleapis.com/youtube/v3/videos"
            f"?part=snippet,contentDetails&id={video_id}&key={settings.YOUTUBE_API_KEY}"
        )
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(api_url)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items", [])
                if items:
                    snippet = items[0].get("snippet", {})
                    content_details = items[0].get("contentDetails", {})
                    duration_iso = content_details.get("duration", "PT5M")
                    duration_sec = cls._parse_iso8601_duration(duration_iso)

                    thumbnails = snippet.get("thumbnails", {})
                    high_thumb = thumbnails.get("high", {}).get("url") or thumbnails.get("default", {}).get("url")

                    return VideoMetadataResponse(
                        youtube_id=video_id,
                        url=f"https://www.youtube.com/watch?v={video_id}",
                        title=snippet.get("title", f"Video {video_id}"),
                        channel=snippet.get("channelTitle", "Unknown Channel"),
                        thumbnail_url=high_thumb or f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                        duration_seconds=duration_sec
                    )
        return None

    @classmethod
    async def _fetch_via_oembed(cls, video_id: str, canonical_url: str) -> Optional[VideoMetadataResponse]:
        oembed_url = f"https://www.youtube.com/oembed?url={urllib.parse.quote(canonical_url)}&format=json"
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(oembed_url)
            if resp.status_code == 200:
                data = resp.json()
                title = data.get("title", f"YouTube Video ({video_id})")
                channel = data.get("author_name", "YouTube Creator")
                thumbnail = data.get("thumbnail_url") or f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
                
                # Fetch webpage to get duration estimate if possible
                duration_sec = await cls._fetch_webpage_duration(canonical_url, client)

                return VideoMetadataResponse(
                    youtube_id=video_id,
                    url=canonical_url,
                    title=title,
                    channel=channel,
                    thumbnail_url=thumbnail,
                    duration_seconds=duration_sec
                )
        return None

    @classmethod
    async def _fetch_webpage_duration(cls, canonical_url: str, client: httpx.AsyncClient) -> float:
        try:
            resp = await client.get(canonical_url, headers={"User-Agent": "Mozilla/5.0"})
            if resp.status_code == 200:
                # Search for approxDurationMs in page source
                match = re.search(r'"approxDurationMs":\s*"(\d+)"', resp.text)
                if match:
                    return round(float(match.group(1)) / 1000.0, 1)
                # Search for ISO duration in meta tag
                iso_match = re.search(r'itemprop="duration"\s+content="(PT[^"]+)"', resp.text)
                if iso_match:
                    return cls._parse_iso8601_duration(iso_match.group(1))
        except Exception:
            pass
        return 300.0  # Default 5 minutes if webpage duration scraping is blocked

    @staticmethod
    def _parse_iso8601_duration(duration_str: str) -> float:
        """Parses ISO 8601 duration format like PT1H2M10S into seconds."""
        match = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", duration_str)
        if not match:
            return 300.0
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        return float(hours * 3600 + minutes * 60 + seconds)
