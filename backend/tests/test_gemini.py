from app.ai.gemini import GeminiService

def test_gemini_fallback_analysis():
    result = GeminiService.analyze_transcript("Welcome to Python tutorial on recursion.", "Python Recursion Tutorial")
    
    assert result.summary != ""
    assert len(result.key_takeaways) > 0
    assert len(result.concepts) > 0
    assert len(result.chapters) > 0
    assert "name" in result.concepts[0]
    assert "start_seconds" in result.chapters[0]
