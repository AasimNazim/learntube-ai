import { CheckCircle, XCircle, TrendingUp, TrendingDown, RotateCcw, ArrowRight, Clock } from "lucide-react";

interface QuizResultsProps {
  results?: {
    attempt_id?: string;
    score_percent?: number;
    total_questions?: number;
    correct_count?: number;
    score_label?: string;
    strong_concepts?: string[];
    weak_concepts?: string[];
    recommendations?: {
      concept: string;
      section: string;
      source_timestamp?: string;
      ts?: string;
      reason: string;
    }[];
  } | null;
  onReview: (timestamp?: string) => void;
  onRetry: () => void;
}

const defaultStrong = ["Key Principles", "Basic Definitions", "Core Workflows"];
const defaultWeak = ["Advanced Edge Cases", "System Trade-offs"];

const defaultRecommendations = [
  { concept: "Advanced Edge Cases", section: "Edge Cases Breakdown", source_timestamp: "04:15", ts: "04:15", reason: "Review boundary condition questions." },
  { concept: "System Trade-offs", section: "Optimization & Trade-offs", source_timestamp: "08:30", ts: "08:30", reason: "Re-read trade-off comparisons." },
];

export default function QuizResults({ results, onReview, onRetry }: QuizResultsProps) {
  const score = results?.score_percent ?? 72;
  const scoreLabel = results?.score_label ?? (score >= 80 ? "Excellent" : score >= 60 ? "Good Progress" : "Needs Work");
  const totalQuestions = results?.total_questions ?? 10;
  const correctCount = results?.correct_count ?? 7;
  const needsReviewCount = totalQuestions - correctCount;

  const strong = results?.strong_concepts?.length ? results.strong_concepts : defaultStrong;
  const weak = results?.weak_concepts?.length ? results.weak_concepts : defaultWeak;
  const recs = results?.recommendations?.length ? results.recommendations : defaultRecommendations;

  const scoreColor = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b px-8 py-4 sticky top-0 z-10" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <h1 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Your Learning Results</h1>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Score card */}
        <div className="rounded-2xl p-8 mb-8 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-full mb-5" style={{ border: `6px solid ${scoreColor}` }}>
            <div>
              <p className="text-4xl font-bold" style={{ color: scoreColor, fontFamily: "var(--font-display)" }}>{score}%</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{scoreLabel}</h2>
          <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>Video Quiz Assessment Results</p>

          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Questions", value: String(totalQuestions) },
              { label: "Correct", value: String(correctCount) },
              { label: "Needs Review", value: String(needsReviewCount) },
              { label: "Concepts Mastered", value: String(strong.length) },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 rounded-xl" style={{ background: "var(--muted)" }}>
                <p className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{value}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-3">
            <button onClick={onRetry} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-slate-50" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
              <RotateCcw size={15} /> Retake Quiz
            </button>
            <button onClick={() => onReview(recs[0]?.source_timestamp || recs[0]?.ts)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: "var(--primary)", color: "white" }}>
              Review Weak Areas <ArrowRight size={15} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Strong concepts */}
          <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} style={{ color: "var(--success)" }} />
              <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>Strong Concepts</h3>
            </div>
            <div className="space-y-3">
              {strong.map((c) => (
                <div key={c} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={15} style={{ color: "var(--success)" }} />
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>{c}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                      <div className="h-full rounded-full" style={{ width: "90%", background: "var(--success)" }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: "var(--success)" }}>Passed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Needs review */}
          <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={18} style={{ color: "var(--warning)" }} />
              <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>Needs Review</h3>
            </div>
            <div className="space-y-3">
              {weak.map((c) => (
                <div key={c} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle size={15} style={{ color: "var(--warning)" }} />
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>{c}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                      <div className="h-full rounded-full" style={{ width: "40%", background: "var(--warning)" }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: "var(--warning)" }}>Review</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--secondary)" }}>
              <TrendingUp size={16} style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>AI Recommendation</h3>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Personalized review based on your quiz performance</p>
            </div>
          </div>

          {weak.length > 0 && (
            <div className="rounded-xl p-4 mb-5" style={{ background: "var(--secondary)" }}>
              <p className="text-sm" style={{ color: "var(--primary)", fontWeight: 500 }}>
                You should review <strong>{weak.slice(0, 2).join(" and ")}</strong> before continuing to reinforce your understanding.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {recs.map((r, i) => (
              <div key={i} className="flex items-start justify-between p-4 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Review {r.concept}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>Weak area</span>
                  </div>
                  <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{r.reason}</p>
                  <div className="flex items-center gap-1 text-xs" style={{ color: "var(--primary)" }}>
                    <Clock size={11} /> Recommended section: {r.section} at {r.source_timestamp || r.ts || "00:00"}
                  </div>
                </div>
                <button onClick={() => onReview(r.source_timestamp || r.ts)} className="shrink-0 ml-4 text-xs px-3 py-2 rounded-lg font-semibold transition-all hover:opacity-90" style={{ background: "var(--primary)", color: "white" }}>
                  Review →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
