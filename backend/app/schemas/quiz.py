from pydantic import BaseModel, Field
from typing import List, Optional

class TeachMeStep(BaseModel):
    label: str
    content: str

class TeachMeQuickCheck(BaseModel):
    prompt: str
    options: List[str]
    correct_option_index: int
    explanation: str

class TeachMeRequest(BaseModel):
    concept: str = Field(..., description="Concept to teach")

class TeachMeResponse(BaseModel):
    video_id: str
    concept: str
    steps: List[TeachMeStep]
    quick_check: TeachMeQuickCheck

class QuizQuestionSchema(BaseModel):
    id: str
    concept_name: str
    prompt: str
    options: List[str]
    correct_option_index: int = 0
    explanation: Optional[str] = None
    source_timestamp: Optional[str] = None

class QuizSchema(BaseModel):
    id: str
    video_id: str
    title: str
    questions: List[QuizQuestionSchema]

class QuizSubmitRequest(BaseModel):
    quiz_id: str
    answers: List[int] = Field(..., description="Selected option index for each question")

class QuestionResultItem(BaseModel):
    question_id: str
    concept_name: str
    prompt: str
    user_answer_index: int
    correct_option_index: int
    is_correct: bool
    explanation: Optional[str] = None
    source_timestamp: Optional[str] = None

class ReviewRecommendationSchema(BaseModel):
    concept: str
    section: str
    source_timestamp: str
    reason: str

class QuizSubmitResponse(BaseModel):
    attempt_id: str
    score_percent: float
    total_questions: int
    correct_count: int
    score_label: str
    strong_concepts: List[str]
    weak_concepts: List[str]
    results_breakdown: List[QuestionResultItem]
    recommendations: List[ReviewRecommendationSchema]

class AdaptiveQuizRequest(BaseModel):
    concept_name: str
