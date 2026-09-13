from app.ai.embeddings import GeminiEmbeddingService

def test_generate_embedding_dimension():
    text = "Recursion in Python and base cases"
    vec = GeminiEmbeddingService.generate_embedding(text)
    
    assert isinstance(vec, list)
    assert len(vec) == 768
    assert any(x != 0 for x in vec)

def test_generate_embeddings_batch():
    texts = ["Recursion example", "Call stack unwinding"]
    batch = GeminiEmbeddingService.generate_embeddings_batch(texts)
    
    assert len(batch) == 2
    assert len(batch[0]) == 768
    assert len(batch[1]) == 768
