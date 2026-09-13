import { useState, useEffect } from "react";
import { CheckCircle, XCircle, ArrowRight, ChevronLeft, AlertTriangle, Lightbulb, BookOpen } from "lucide-react";
import { getVideoQuiz, submitQuizAnswers } from "../services/api";

interface QuizProps {
  videoId?: string;
  onComplete: (results?: any) => void;
  onBack: () => void;
}

const defaultQuestions = [
  {
    id: "default-1",
    concept: "Core Concept",
    q: "What is the primary technical objective presented in this video?",
    options: [
      "To establish foundational understanding of core concepts",
      "To optimize execution performance",
      "To demonstrate practical implementation patterns",
      "All of the above",
    ],
    correct: 3,
    explanation: "The video presents foundational concepts, performance optimization, and practical implementation patterns.",
    source: "01:00",
  },
  {
    id: "default-2",
    concept: "Key Principle",
    q: "How does the instructor structure the core explanation?",
    options: [
      "By introducing definitions first, followed by step-by-step examples",
      "By skipping explanations and writing code only",
      "By focusing exclusively on theory",
      "By comparing unrelated frameworks",
    ],
    correct: 0,
    explanation: "The material is structured by defining principles first and then walking through examples.",
    source: "03:15",
  },
];

const weakConceptThreshold = 2;

export default function Quiz({ videoId, onComplete, onBack }: QuizProps) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [userChoices, setUserChoices] = useState<number[]>([]);
  const [conceptMisses, setConceptMisses] = useState<Record<string, number>>({});
  const [showAdaptive, setShowAdaptive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [quizData, setQuizData] = useState<{ id: string; title: string; questions: any[] }>({
    id: "demo-quiz",
    title: "Video Quiz",
    questions: defaultQuestions,
  });

  useEffect(() => {
    if (!videoId) return;
    getVideoQuiz(videoId)
      .then((res) => {
        if (res && res.questions && res.questions.length > 0) {
          const mapped = res.questions.map((q) => ({
            id: q.id,
            concept: q.concept_name || "General",
            q: q.prompt,
            options: q.options || [],
            correct: q.correct_option_index ?? 0,
            explanation: q.explanation || "Review the video transcript for details.",
            source: q.source_timestamp || "00:00",
          }));
          setQuizData({
            id: res.id,
            title: res.title || "Video Quiz",
            questions: mapped,
          });
        }
      })
      .catch((err) => {
        console.warn("Could not load backend quiz, using defaults:", err);
      });
  }, [videoId]);

  const questionsList = quizData.questions;
  const q = questionsList[current] || defaultQuestions[0];
  const isCorrect = selected === q.correct;
  const progress = ((current + 1) / questionsList.length) * 100;

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    const correct = selected === q.correct;
    setAnswers((prev) => [...prev, correct]);
    setUserChoices((prev) => [...prev, selected]);

    if (!correct) {
      setConceptMisses((prev) => {
        const updated: Record<string, number> = { ...prev, [q.concept]: (prev[q.concept] || 0) + 1 };
        if (updated[q.concept] >= weakConceptThreshold) setShowAdaptive(true);
        return updated;
      });
    }
  };

  const handleNext = async () => {
    setShowAdaptive(false);
    if (current < questionsList.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setSubmitted(false);
    } else {
      // Quiz complete! Submit to backend if videoId exists
      const finalChoices = [...userChoices];
      if (selected !== null && finalChoices.length <= current) {
        finalChoices.push(selected);
      }

      if (videoId && quizData.id) {
        try {
          setSubmitting(true);
          const res = await submitQuizAnswers(videoId, quizData.id, finalChoices);
          onComplete(res);
          return;
        } catch (err) {
          console.error("Failed to submit quiz answers to backend:", err);
        } finally {
          setSubmitting(false);
        }
      }
      onComplete();
    }
  };

  const weakConcept = Object.entries(conceptMisses).find(([, count]) => count >= weakConceptThreshold)?.[0];

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Top bar */}
      <div className="border-b px-8 py-4 flex items-center gap-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium transition-all hover:opacity-70"
          style={{ color: "var(--muted-foreground)" }}
        >
          <ChevronLeft size={16} /> Back to Workspace
        </button>
        <div className="h-4 w-px" style={{ background: "var(--border)" }} />
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{quizData.title}</p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Interactive Knowledge Check</p>
        </div>
        <span className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
          {Math.min(current + 1, questionsList.length)} <span style={{ color: "var(--border)" }}>/</span> {questionsList.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1" style={{ background: "var(--muted)" }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, background: "var(--primary)" }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto flex items-start justify-center py-12 px-8">
        <div className="w-full max-w-2xl">
          {/* Concept tag */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
              {q.concept}
            </span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Question {current + 1} of {questionsList.length}
            </span>
          </div>

          {/* Question */}
          <h2 className="text-xl font-semibold mb-8 leading-snug" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
            {q.q}
          </h2>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {q.options.map((opt: string, i: number) => {
              let bg = "var(--card)";
              let border = "var(--border)";
              let color = "var(--foreground)";
              let icon = null;

              if (submitted) {
                if (i === q.correct) {
                  bg = "#F0FDF4"; border = "#86EFAC"; color = "#166534";
                  icon = <CheckCircle size={18} style={{ color: "#22C55E" }} />;
                } else if (i === selected && !isCorrect) {
                  bg = "#FEF2F2"; border = "#FECACA"; color = "#991B1B";
                  icon = <XCircle size={18} style={{ color: "#EF4444" }} />;
                }
              } else if (selected === i) {
                border = "var(--primary)"; bg = "var(--secondary)"; color = "var(--primary)";
              }

              return (
                <button
                  key={i}
                  disabled={submitted}
                  onClick={() => setSelected(i)}
                  className="w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 group"
                  style={{ background: bg, borderColor: border, color }}
                >
                  <span
                    className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-semibold transition-all"
                    style={{
                      background: submitted && i === q.correct ? "#22C55E" : submitted && i === selected && !isCorrect ? "#EF4444" : selected === i ? "var(--primary)" : "var(--muted)",
                      color: submitted && (i === q.correct || (i === selected && !isCorrect)) ? "white" : selected === i ? "white" : "var(--muted-foreground)",
                    }}
                  >
                    {submitted && icon ? icon : String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm leading-relaxed">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {submitted && (
            <div
              className="rounded-xl p-5 mb-6 border"
              style={{
                background: isCorrect ? "#F0FDF4" : "#FFFBEB",
                borderColor: isCorrect ? "#86EFAC" : "#FDE68A",
              }}
            >
              <div className="flex items-start gap-3">
                {isCorrect
                  ? <CheckCircle size={18} style={{ color: "#22C55E", marginTop: 1 }} />
                  : <Lightbulb size={18} style={{ color: "#D97706", marginTop: 1 }} />
                }
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: isCorrect ? "#166534" : "#92400E" }}>
                    {isCorrect ? "Correct" : "Not quite — here's why"}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: isCorrect ? "#166534" : "#92400E" }}>
                    {q.explanation}
                  </p>
                  <p className="text-xs mt-2 opacity-70" style={{ color: isCorrect ? "#166534" : "#92400E" }}>
                    Source: {q.source}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Adaptive callout */}
          {submitted && showAdaptive && weakConcept && (
            <div className="rounded-xl p-4 mb-6 border flex items-start gap-3" style={{ background: "#FFF7ED", borderColor: "#FED7AA" }}>
              <AlertTriangle size={17} style={{ color: "#C2410C", marginTop: 1 }} />
              <div className="flex-1">
                <p className="text-sm font-semibold mb-0.5" style={{ color: "#C2410C" }}>
                  You seem to be struggling with {weakConcept}
                </p>
                <p className="text-xs mb-2" style={{ color: "#C2410C" }}>
                  We'll include more practice questions on this concept before the quiz ends.
                </p>
                <button className="text-xs font-semibold flex items-center gap-1" style={{ color: "#C2410C" }}>
                  <BookOpen size={12} /> Practice {weakConcept} now
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={selected === null}
              className="w-full py-4 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: selected !== null ? "var(--primary)" : "var(--muted)",
                color: selected !== null ? "white" : "var(--muted-foreground)",
                cursor: selected === null ? "not-allowed" : "pointer",
              }}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={submitting}
              className="w-full py-4 rounded-xl font-semibold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: "var(--primary)", color: "white" }}
            >
              {submitting ? "Calculating Results..." : current < questionsList.length - 1 ? "Next Question" : "See My Results"}
              <ArrowRight size={16} />
            </button>
          )}

          {/* Mini progress dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {questionsList.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === current ? 20 : 8,
                  height: 8,
                  background: answers[i] === true ? "var(--success)" : answers[i] === false ? "var(--warning)" : i === current ? "var(--primary)" : "var(--border)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
