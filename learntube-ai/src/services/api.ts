import {
  Video,
  Concept,
  Chapter,
  TutorMessage,
  Quiz,
  QuizResult,
  LearningGap,
  ReviewRecommendation,
  LearningProgress
} from "../types/learning";

const apiBaseUrl = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://127.0.0.1:8000")).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("learntube_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers,
    });
  } catch (err: any) {
    console.error("API Network Error:", err);
    throw new ApiError(0, `Cannot connect to server at ${apiBaseUrl}. Please verify backend is running.`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText || response.statusText);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// ── API SERVICE FUNCTIONS ──

export async function processVideoUrl(url: string) {
  return apiRequest<{ video_id: string; youtube_id: string; title: string; status: string }>(
    "/api/videos/process",
    {
      method: "POST",
      body: JSON.stringify({ url }),
    }
  );
}

export async function getVideoDetail(videoId: string) {
  return apiRequest<{
    id: string;
    youtube_id: string;
    url: string;
    title: string;
    channel?: string;
    thumbnail_url?: string;
    duration_seconds?: number;
    duration_formatted?: string;
    summary?: string;
    key_takeaways: string[];
  }>(`/api/videos/${videoId}`);
}

export async function getVideoConcepts(videoId: string) {
  return apiRequest<
    {
      id: string;
      name: string;
      description?: string;
      timestamp_seconds: number;
      timestamp_formatted: string;
      difficulty: string;
    }[]
  >(`/api/videos/${videoId}/concepts`);
}

export async function getVideoChapters(videoId: string) {
  return apiRequest<
    {
      id: string;
      title: string;
      summary?: string;
      start_seconds: number;
      end_seconds?: number;
      timestamp_formatted: string;
    }[]
  >(`/api/videos/${videoId}/chapters`);
}

export async function askTutor(videoId: string, question: string) {
  return apiRequest<{
    answer: string;
    source_timestamp?: string;
    confidence: number;
    grounded: boolean;
    sources: any[];
  }>(`/api/videos/${videoId}/ask`, {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

export async function getSegmentExplanation(videoId: string, startSeconds: number, endSeconds: number) {
  return apiRequest<{
    explanation: string;
    key_concepts: string[];
    takeaway: string;
    timestamp_range_formatted: string;
  }>(`/api/videos/${videoId}/segment-tutor`, {
    method: "POST",
    body: JSON.stringify({ start_seconds: startSeconds, end_seconds: endSeconds }),
  });
}

export async function getTeachMeLesson(videoId: string, concept: string) {
  return apiRequest<{
    concept: string;
    steps: { label: string; content: string }[];
    quick_check: {
      prompt: string;
      options: string[];
      correct_option_index: number;
      explanation: string;
    };
  }>(`/api/videos/${videoId}/teach-me`, {
    method: "POST",
    body: JSON.stringify({ concept }),
  });
}

export async function getVideoQuiz(videoId: string) {
  return apiRequest<{
    id: string;
    video_id: string;
    title: string;
    questions: {
      id: string;
      concept_name: string;
      prompt: string;
      options: string[];
      correct_option_index?: number;
      explanation?: string;
      source_timestamp?: string;
    }[];
  }>(`/api/videos/${videoId}/quiz`);
}

export async function submitQuizAnswers(videoId: string, quizId: string, answers: number[]) {
  return apiRequest<{
    attempt_id: string;
    score_percent: number;
    total_questions: number;
    correct_count: number;
    score_label: string;
    strong_concepts: string[];
    weak_concepts: string[];
    results_breakdown: any[];
    recommendations: {
      concept: string;
      section: string;
      source_timestamp: string;
      reason: string;
    }[];
  }>(`/api/videos/${videoId}/quiz/submit`, {
    method: "POST",
    body: JSON.stringify({ quiz_id: quizId, answers }),
  });
}

export async function getAdaptiveQuiz(videoId: string, conceptName: string) {
  return apiRequest<any[]>(`/api/videos/${videoId}/quiz/adaptive`, {
    method: "POST",
    body: JSON.stringify({ concept_name: conceptName }),
  });
}

export async function getLearningDashboard() {
  return apiRequest<{
    stats: { label: string; value: string; icon: string; color: string }[];
    courses: {
      video_id: string;
      title: string;
      topic: string;
      progress: number;
      last_studied: string;
      chapters_completed: number;
      total_chapters: number;
      color: string;
    }[];
    strengths: { concept: string; score: number }[];
    gaps: { concept: string; score: number; video_title: string; timestamp_formatted: string }[];
    reviews: { video_id?: string; concept: string; video_title: string; timestamp_formatted: string; reason: string }[];
  }>("/api/user/learning");
}

export async function loginUser(email: string, password: string) {
  const res = await apiRequest<{ access_token: string; user: any }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (res.access_token) {
    localStorage.setItem("learntube_token", res.access_token);
  }
  return res;
}

export async function signupUser(email: string, password: string, fullName?: string) {
  const res = await apiRequest<{ access_token: string; user: any }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  if (res.access_token) {
    localStorage.setItem("learntube_token", res.access_token);
  }
  return res;
}

export { apiBaseUrl };
