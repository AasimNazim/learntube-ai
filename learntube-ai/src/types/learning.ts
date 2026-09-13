export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
}

export interface Transcript {
  id: string;
  videoId: string;
  text: string;
  language?: string;
}

export interface Chapter {
  id: string;
  title: string;
  startSeconds: number;
  endSeconds?: number;
  summary?: string;
}

export interface Concept {
  id: string;
  name: string;
  description?: string;
}

export interface TutorMessage {
  id: string;
  role: "user" | "tutor";
  content: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctOptionIndex?: number;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  quizId: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

export interface LearningGap {
  id: string;
  conceptId: string;
  label: string;
  severity: "low" | "medium" | "high";
}

export interface ReviewRecommendation {
  id: string;
  title: string;
  reason: string;
  resourceId?: string;
}

export interface LearningProgress {
  videoId: string;
  completionPercent: number;
  lastViewedAt?: string;
}
