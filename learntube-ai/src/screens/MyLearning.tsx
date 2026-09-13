import { useState, useEffect } from "react";
import { BookOpen, Clock, Target, TrendingUp, TrendingDown, Play, ArrowRight, BarChart2, Zap } from "lucide-react";
import { getLearningDashboard } from "../services/api";

interface MyLearningProps {
  onContinue: (videoId?: string) => void;
}

export default function MyLearning({ onContinue }: MyLearningProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [strengths, setStrengths] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLearningDashboard()
      .then((data) => {
        if (data) {
          if (data.courses) {
            setCourses(
              data.courses.map((c) => ({
                videoId: c.video_id,
                title: c.title,
                topic: c.topic || "General",
                progress: c.progress || 0,
                lastStudied: c.last_studied || "Recently",
                chapters: c.chapters_completed || 0,
                totalChapters: c.total_chapters || 1,
                color: c.color || "var(--primary)",
              }))
            );
          }
          if (data.strengths) {
            setStrengths(data.strengths);
          }
          if (data.gaps) {
            setGaps(
              data.gaps.map((g) => ({
                concept: g.concept,
                score: g.score,
                video: g.video_title || "Course Video",
                ts: g.timestamp_formatted || "00:00",
              }))
            );
          }
          if (data.reviews) {
            setReviews(
              data.reviews.map((r) => ({
                concept: r.concept,
                video: r.video_title || "Course Video",
                ts: r.timestamp_formatted || "00:00",
                reason: r.reason,
              }))
            );
          }
          if (data.stats) {
            const iconMap: Record<string, any> = { BookOpen, Target, BarChart2, Clock };
            setStats(
              data.stats.map((s) => ({
                label: s.label,
                value: s.value,
                icon: iconMap[s.icon] || BookOpen,
                color: s.color || "var(--primary)",
              }))
            );
          }
        }
      })
      .catch((err) => {
        console.warn("Could not fetch user dashboard metrics:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="border-b px-8 py-4 sticky top-0 z-10" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <h1 className="font-semibold" style={{ color: "var(--foreground)" }}>My Learning</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Track your progress and review your weak areas.</p>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="p-5 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--muted)" }}>
                <Icon size={18} style={{ color }} />
              </div>
              <p className="text-2xl font-bold mb-0.5" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>{value}</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Continue Learning */}
        <div className="mb-8">
          <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <Play size={16} style={{ color: "var(--primary)" }} /> Continue Learning
          </h2>
          {courses.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {courses.map((c) => (
                <div key={c.videoId || c.title} className="p-5 rounded-2xl border hover:shadow-md transition-all group" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full mb-2 inline-block" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>{c.topic}</span>
                      <h3 className="font-semibold text-sm leading-snug" style={{ color: "var(--foreground)" }}>{c.title}</h3>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: c.color }}>{c.progress}%</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${c.progress}%`, background: c.color }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <span className="flex items-center gap-1"><Clock size={11} /> {c.lastStudied}</span>
                      <span>{c.chapters}/{c.totalChapters} chapters</span>
                    </div>
                    <button onClick={() => onContinue(c.videoId)} className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all hover:opacity-90" style={{ background: c.color, color: "white" }}>
                      Continue <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs rounded-xl border" style={{ background: "var(--card)", color: "var(--muted-foreground)", borderColor: "var(--border)" }}>
              No videos processed yet. Paste a YouTube URL on the Home screen to start learning!
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={18} style={{ color: "var(--success)" }} />
              <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Learning Strengths</h2>
            </div>
            {strengths.length > 0 ? (
              <div className="space-y-4">
                {strengths.map(({ concept, score }) => (
                  <div key={concept}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span style={{ color: "var(--foreground)" }}>{concept}</span>
                      <span className="font-semibold" style={{ color: "var(--success)" }}>{score}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                      <div className="h-full rounded-full" style={{ width: `${score}%`, background: "var(--success)" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Process educational videos to automatically track your strongest concept areas.
              </p>
            )}
          </div>

          {/* Gaps */}
          <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-5">
              <TrendingDown size={18} style={{ color: "var(--warning)" }} />
              <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Learning Gaps</h2>
            </div>
            {gaps.length > 0 ? (
              <div className="space-y-4">
                {gaps.map(({ concept, score, ts }) => (
                  <div key={concept}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span style={{ color: "var(--foreground)" }}>{concept}</span>
                      <span className="font-semibold" style={{ color: "var(--warning)" }}>{score}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                      <div className="h-full rounded-full" style={{ width: `${score}%`, background: "var(--warning)" }} />
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                      Recommended review at {ts}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                No learning gaps identified yet. Take a quiz on any of your videos to assess weak areas!
              </p>
            )}
          </div>
        </div>

        {/* Recommended Reviews */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} style={{ color: "var(--primary)" }} />
            <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Recommended Reviews</h2>
          </div>
          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--secondary)" }}>
                      <BookOpen size={16} style={{ color: "var(--primary)" }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Review {r.concept}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>Recommended</span>
                      </div>
                      <p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>{r.reason}</p>
                      <p className="text-xs" style={{ color: "var(--primary)" }}>
                        {r.video} · {r.ts}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => onContinue()} className="shrink-0 ml-4 text-xs px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-90" style={{ background: "var(--primary)", color: "white" }}>
                    Review
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs rounded-xl border" style={{ background: "var(--card)", color: "var(--muted-foreground)", borderColor: "var(--border)" }}>
              No pending reviews! Complete video quizzes to receive personalized review recommendations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
