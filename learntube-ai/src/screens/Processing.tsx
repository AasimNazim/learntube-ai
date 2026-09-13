import { useEffect, useState } from "react";
import { CheckCircle, Circle, Loader2, AlertCircle } from "lucide-react";
import { processVideoUrl } from "../services/api";

interface ProcessingProps {
  url?: string;
  onComplete: (videoId: string) => void;
}

const steps = [
  { id: 1, label: "Getting video information", delay: 800 },
  { id: 2, label: "Getting video transcript", delay: 1800 },
  { id: 3, label: "Understanding key concepts", delay: 3200 },
  { id: 4, label: "Creating chapter timeline", delay: 4600 },
  { id: 5, label: "Preparing AI Tutor", delay: 6000 },
  { id: 6, label: "Preparing learning assessment", delay: 7200 },
];

export default function Processing({ url, onComplete }: ProcessingProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeStep, setActiveStep] = useState(1);
  const [done, setDone] = useState(false);
  const [videoId, setVideoId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const targetUrl = url || "https://www.youtube.com/watch?v=rfscVS0vtbw";

    // Step animation timer
    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach(({ id, delay }) => {
      timers.push(
        setTimeout(() => {
          if (isMounted) {
            setCompletedSteps((prev) => (prev.includes(id) ? prev : [...prev, id]));
            setActiveStep(id + 1);
          }
        }, delay)
      );
    });

    // Call real Backend Pipeline API
    processVideoUrl(targetUrl)
      .then((res) => {
        if (isMounted) {
          setVideoId(res.video_id);
          // Ensure step animation reaches completion
          setCompletedSteps([1, 2, 3, 4, 5, 6]);
          setDone(true);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          console.error("Processing error:", err);
          let msg = "Failed to process video transcript.";
          if (err.message) {
            try {
              const parsed = JSON.parse(err.message);
              msg = parsed.detail || msg;
            } catch {
              msg = err.message;
            }
          }
          setErrorMsg(msg);
          setDone(false);
        }
      });

    return () => {
      isMounted = false;
      timers.forEach(clearTimeout);
    };
  }, [url]);

  const progress = Math.min(100, Math.round((completedSteps.length / steps.length) * 100));

  return (
    <div className="flex-1 overflow-y-auto flex items-center justify-center p-8">
      <div className="max-w-lg w-full">
        {/* Processing card */}
        <div className="rounded-2xl p-8 border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="text-center mb-8">
            {done ? (
              <>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--secondary)" }}>
                  <CheckCircle size={28} style={{ color: "var(--primary)" }} />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
                  Your learning experience is ready!
                </h2>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  AI has fully processed the video transcript and prepared your workspace.
                </p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--secondary)" }}>
                  <Loader2 size={28} style={{ color: "var(--primary)" }} className="animate-spin" />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
                  Preparing your learning experience…
                </h2>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  Our AI agent is actively processing the YouTube video content.
                </p>
              </>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
              <span>Processing</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: "var(--primary)" }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-8">
            {steps.map(({ id, label }) => {
              const isComplete = completedSteps.includes(id);
              const isActive = activeStep === id && !isComplete;
              return (
                <div key={id} className="flex items-center gap-3">
                  {isComplete ? (
                    <CheckCircle size={18} style={{ color: "var(--success)" }} />
                  ) : isActive ? (
                    <Loader2 size={18} style={{ color: "var(--primary)" }} className="animate-spin" />
                  ) : (
                    <Circle size={18} style={{ color: "var(--border)" }} />
                  )}
                  <span
                    className="text-sm"
                    style={{
                      color: isComplete ? "var(--foreground)" : isActive ? "var(--primary)" : "var(--muted-foreground)",
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {done && (
            <button
              onClick={() => onComplete(videoId)}
              className="w-full py-3.5 rounded-xl font-semibold transition-all hover:opacity-90"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              Open Learning Workspace →
            </button>
          )}

          {errorMsg && (
            <div className="mt-4 p-3 rounded-xl flex gap-2 items-start" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
              <AlertCircle size={15} style={{ color: "#C2410C", marginTop: 1 }} />
              <p className="text-xs" style={{ color: "#C2410C" }}>
                {errorMsg}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
