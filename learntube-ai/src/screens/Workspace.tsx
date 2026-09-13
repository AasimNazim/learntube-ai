import { useEffect, useState, useRef } from "react";
import { Send, Play, Clock, User, BookOpen, Layers, List, Brain, HelpCircle, ExternalLink, ChevronRight, Sparkles, Info, CheckCircle } from "lucide-react";
import {
  getVideoDetail,
  getVideoConcepts,
  getVideoChapters,
  askTutor,
  getTeachMeLesson,
  getSegmentExplanation
} from "../services/api";

interface WorkspaceProps {
  videoId?: string;
  initialSeekTime?: string | number | null;
  onStartQuiz: () => void;
}

type Tab = "summary" | "concepts" | "chapters" | "teachme";

function DifficultyBadge({ level }: { level: string }) {
  const color =
    level === "Easy" ? { bg: "#DCFCE7", text: "#166534" } :
    level === "Medium" ? { bg: "#FEF3C7", text: "#92400E" } :
    { bg: "#FEE2E2", text: "#991B1B" };
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: color.bg, color: color.text }}>
      {level}
    </span>
  );
}

function parseTimestampToSeconds(ts: number | string | undefined | null): number {
  if (ts === undefined || ts === null) return 0;
  if (typeof ts === "number") return isNaN(ts) ? 0 : Math.max(0, ts);
  const str = String(ts).trim().replace(/[sS]$/, "");
  if (!str) return 0;
  const parts = str.split(":").map((p) => parseFloat(p));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function SummaryTab({ videoDetail, concepts, onSeek }: { videoDetail: any; concepts: any[]; onSeek?: (sec: number) => void }) {
  const summaryText = videoDetail?.summary || "Processing summary for this video...";
  const takeaways = videoDetail?.key_takeaways?.length
    ? videoDetail.key_takeaways
    : concepts.map((c) => `Master ${c.name}: ${c.description || "Key topic covered in this video."}`);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <Info size={15} style={{ color: "var(--primary)" }} /> Video Overview
        </h3>
        <p className="text-sm leading-relaxed rounded-xl p-4" style={{ color: "var(--muted-foreground)", background: "var(--muted)" }}>
          {summaryText}
        </p>
      </div>
      {takeaways.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--foreground)" }}>Key Takeaways</h3>
          <ul className="space-y-2">
            {takeaways.map((t: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                <CheckCircle size={14} style={{ color: "var(--success)", marginTop: 2 }} />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
      {concepts.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--foreground)" }}>Key Concepts</h3>
          <div className="grid grid-cols-2 gap-3">
            {concepts.slice(0, 4).map((c: any) => (
              <div
                key={c.id || c.name}
                onClick={() => onSeek?.(c.timestamp_seconds)}
                className="p-4 rounded-xl border cursor-pointer hover:border-indigo-400 transition-all"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{c.name}</span>
                  <DifficultyBadge level={c.difficulty || "Medium"} />
                </div>
                <p className="text-xs mb-2 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{c.description}</p>
                <p className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--primary)" }}>
                  <Play size={11} /> ⏱ {c.timestamp_formatted || "00:00"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ConceptsTab({ concepts, onSeek }: { concepts: any[]; onSeek?: (sec: number) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  if (!concepts || concepts.length === 0) {
    return (
      <div className="p-6 text-sm" style={{ color: "var(--muted-foreground)" }}>
        No concept tags identified yet for this video.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-3">
      {concepts.map((c: any) => (
        <div
          key={c.id || c.name}
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: selected === c.name ? "var(--primary)" : "var(--border)" }}
        >
          <div
            className="p-4 cursor-pointer flex items-start justify-between"
            style={{ background: "var(--card)" }}
            onClick={() => {
              setSelected(selected === c.name ? null : c.name);
              onSeek?.(c.timestamp_seconds);
            }}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{c.name}</span>
                <DifficultyBadge level={c.difficulty || "Medium"} />
              </div>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{c.description}</p>
            </div>
            <ChevronRight
              size={15}
              style={{
                color: "var(--muted-foreground)",
                transform: selected === c.name ? "rotate(90deg)" : "none",
                transition: "transform 0.2s",
              }}
            />
          </div>
          {selected === c.name && (
            <div className="px-4 pb-4 pt-0" style={{ background: "var(--muted)" }}>
              <div
                className="flex items-center gap-2 mb-3 cursor-pointer hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek?.(c.timestamp_seconds);
                }}
              >
                <Clock size={13} style={{ color: "var(--primary)" }} />
                <span className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--primary)" }}>
                  <Play size={11} /> Jump to Source: {c.timestamp_formatted || "00:00"}
                </span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ChaptersTab({ chapters, onSeek }: { chapters: any[]; onSeek?: (sec: number) => void }) {
  const [active, setActive] = useState<string | null>(null);

  if (!chapters || chapters.length === 0) {
    return (
      <div className="p-6 text-sm" style={{ color: "var(--muted-foreground)" }}>
        No chapters identified yet for this video timeline.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-2">
      {chapters.map((ch: any) => (
        <div
          key={ch.id || ch.title}
          className="flex gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:border-indigo-400"
          style={{
            background: active === ch.timestamp_formatted ? "var(--secondary)" : "var(--card)",
            borderColor: active === ch.timestamp_formatted ? "var(--primary)" : "var(--border)",
          }}
          onClick={() => {
            setActive(ch.timestamp_formatted);
            onSeek?.(ch.start_seconds);
          }}
        >
          <div className="shrink-0 pt-0.5">
            <span className="text-xs font-mono font-semibold" style={{ color: "var(--primary)" }}>
              {ch.timestamp_formatted || "00:00"}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--foreground)" }}>{ch.title}</p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{ch.summary}</p>
          </div>
          <Play size={13} style={{ color: "var(--primary)", marginTop: 3 }} />
        </div>
      ))}
    </div>
  );
}

function TeachMeTab({ videoId, concepts, onStartQuiz }: { videoId?: string; concepts: any[]; onStartQuiz: () => void }) {
  const [step, setStep] = useState(0);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [lessonData, setLessonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const targetConcept = concepts[0]?.name || "Core Concept";

  useEffect(() => {
    if (!videoId) return;
    setLoading(true);
    getTeachMeLesson(videoId, targetConcept)
      .then((res) => {
        setLessonData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [videoId, targetConcept]);

  const steps = lessonData?.steps || [
    {
      label: "Understand the Idea",
      content: `Let's break down ${targetConcept} from this video step by step.`,
    },
    {
      label: "Core Explanation",
      content: `This video explores ${targetConcept} to help build a solid foundational understanding.`,
    },
  ];

  const quickCheck = lessonData?.quick_check || {
    prompt: `What is the key takeaway regarding ${targetConcept}?`,
    options: ["It provides foundational structure", "It optimizes performance", "It simplifies logic", "All of the above"],
    correct_option_index: 3,
    explanation: `${targetConcept} helps structure your understanding across all of these areas.`
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Brain size={17} style={{ color: "var(--primary)" }} />
          <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
            Teach Me: {targetConcept}
          </h3>
        </div>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Step-by-step AI teaching session</p>
      </div>

      <div className="flex gap-2 mb-6">
        {steps.map((s: any, i: number) => (
          <div key={i} className="flex-1 text-center">
            <div
              className="h-1 rounded-full mb-2 transition-all"
              style={{ background: i <= step ? "var(--primary)" : "var(--border)" }}
            />
            <span className="text-xs" style={{ color: i === step ? "var(--primary)" : "var(--muted-foreground)", fontWeight: i === step ? 600 : 400 }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-5 mb-4" style={{ background: "var(--muted)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--primary)" }}>
          Step {step + 1} — {steps[step]?.label}
        </p>
        {step === 1 ? (
          <pre className="text-xs leading-relaxed font-mono p-3 rounded-lg overflow-x-auto" style={{ background: "#1E1B4B", color: "#C7D2FE" }}>
            {steps[step]?.content}
          </pre>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--foreground)" }}>
            {steps[step]?.content}
          </p>
        )}
      </div>

      {step < steps.length - 1 ? (
        <button
          onClick={() => setStep((s) => s + 1)}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
          style={{ background: "var(--primary)", color: "white" }}
        >
          Next Step
        </button>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl p-4 border" style={{ borderColor: "var(--primary)", background: "var(--secondary)" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--primary)" }}>Quick Check</p>
            <p className="text-sm font-medium mb-3" style={{ color: "var(--foreground)" }}>
              {quickCheck.prompt}
            </p>
            {quickCheck.options.map((opt: string, i: number) => (
              <button
                key={i}
                onClick={() => setAnswered(i === quickCheck.correct_option_index)}
                className="w-full text-left text-sm p-2.5 rounded-lg mb-2 transition-all border"
                style={{
                  background: answered !== null && i === quickCheck.correct_option_index ? "#DCFCE7" : "var(--card)",
                  borderColor: answered !== null && i === quickCheck.correct_option_index ? "var(--success)" : "var(--border)",
                  color: "var(--foreground)",
                }}
              >
                {opt}
              </button>
            ))}
            {answered !== null && (
              <div className="mt-2 p-3 rounded-lg text-xs" style={{ background: answered ? "#DCFCE7" : "#FEE2E2", color: answered ? "#166534" : "#991B1B" }}>
                {answered ? "Correct! " + quickCheck.explanation : "Not quite — " + quickCheck.explanation}
              </div>
            )}
          </div>
          <button onClick={onStartQuiz} className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90" style={{ background: "var(--primary)", color: "white" }}>
            Test My Understanding
          </button>
        </div>
      )}
    </div>
  );
}

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "summary", label: "Summary", icon: BookOpen },
  { id: "concepts", label: "Concepts", icon: Layers },
  { id: "chapters", label: "Chapters", icon: List },
  { id: "teachme", label: "Teach Me", icon: Brain },
];

export default function Workspace({ videoId, initialSeekTime, onStartQuiz }: WorkspaceProps) {
  const [tab, setTab] = useState<Tab>("summary");
  const [videoDetail, setVideoDetail] = useState<any>(null);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([
    {
      role: "ai",
      text: "Hi! I've finished processing this video transcript. I can answer any question grounded in the video with timestamp evidence.",
      source: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [seekTime, setSeekTime] = useState<number>(() => {
    return initialSeekTime ? parseTimestampToSeconds(initialSeekTime) : 0;
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!videoId) return;
    setVideoDetail(null);
    setConcepts([]);
    setChapters([]);
    const startSec = initialSeekTime ? parseTimestampToSeconds(initialSeekTime) : 0;
    setSeekTime(startSec);
    setMessages([
      {
        role: "ai",
        text: "Hi! I've finished processing this video transcript. I can answer any question grounded in the video with timestamp evidence.",
        source: null,
      },
    ]);
    getVideoDetail(videoId).then(setVideoDetail).catch(console.error);
    getVideoConcepts(videoId).then(setConcepts).catch(console.error);
    getVideoChapters(videoId).then(setChapters).catch(console.error);
  }, [videoId]);

  useEffect(() => {
    if (initialSeekTime !== undefined && initialSeekTime !== null) {
      const sec = parseTimestampToSeconds(initialSeekTime);
      if (sec > 0) {
        handleSeek(sec);
      }
    }
  }, [initialSeekTime]);

  const handleSeek = (rawSec: number | string) => {
    const sec = Math.max(0, Math.floor(parseTimestampToSeconds(rawSec)));
    setSeekTime(sec);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "seekTo", args: [sec, true] }),
          "*"
        );
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "playVideo", args: [] }),
          "*"
        );
      } catch (err) {
        console.error("YouTube Player Seek error:", err);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userQ = input;
    const userMsg = { role: "user", text: userQ, source: null };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);

    try {
      if (videoId) {
        const res = await askTutor(videoId, userQ);
        setMessages((m) => [
          ...m,
          {
            role: "ai",
            text: res.answer,
            source: res.source_timestamp,
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "ai",
            text: "Please select or process a video to ask questions grounded in its transcript.",
            source: null,
          },
        ]);
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: "I experienced an error fetching the response from the AI tutor.",
          source: null,
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const titleText = videoDetail?.title || "Video Workspace";
  const channelText = videoDetail?.channel || "YouTube";
  const durationText = videoDetail?.duration_formatted || "00:00";
  const thumbUrl = videoDetail?.thumbnail_url || "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=900&h=380&fit=crop&auto=format";

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Video + tabs */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <h1 className="font-semibold text-sm leading-snug" style={{ color: "var(--foreground)" }}>
            {titleText}
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
              <User size={12} /> {channelText}
            </span>
            <span className="text-xs flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
              <Clock size={12} /> {durationText}
            </span>
          </div>
        </div>

        {/* Video player */}
        <div className="relative shrink-0 w-full overflow-hidden" style={{ height: "190px", background: "#000" }}>
          {videoDetail?.youtube_id ? (
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${videoDetail.youtube_id}?enablejsapi=1&autoplay=1&start=${seekTime}&rel=0`}
              title={titleText}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <img
                src={thumbUrl}
                alt={titleText}
                className="absolute inset-0 w-full h-full object-cover opacity-50"
                style={{ objectPosition: "center 30%" }}
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(15,10,50,0.3) 0%, rgba(15,10,50,0.5) 100%)" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                  style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.25)" }}
                >
                  <Play size={20} color="white" fill="white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0">
                <div className="flex items-center justify-between px-4 pb-2 pt-1">
                  <span className="text-xs text-white font-mono opacity-80">00:00 / {durationText}</span>
                  <span className="text-xs text-white opacity-50">▶ Video Preview</span>
                </div>
                <div className="h-0.5 w-full" style={{ background: "rgba(255,255,255,0.15)" }}>
                  <div className="h-full" style={{ width: "21%", background: "var(--primary)" }} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tabs + Quiz CTA */}
        <div className="flex items-center border-b px-4 gap-1" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex flex-1 gap-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px"
                style={{
                  borderColor: tab === id ? "var(--primary)" : "transparent",
                  color: tab === id ? "var(--primary)" : "var(--muted-foreground)",
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={onStartQuiz}
            className="flex items-center gap-2 ml-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90 shrink-0"
            style={{ background: "var(--primary)", color: "white" }}
          >
            <HelpCircle size={13} /> Take Quiz
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto" style={{ background: "var(--background)" }}>
          {tab === "summary" && <SummaryTab videoDetail={videoDetail} concepts={concepts} onSeek={handleSeek} />}
          {tab === "concepts" && <ConceptsTab concepts={concepts} onSeek={handleSeek} />}
          {tab === "chapters" && <ChaptersTab chapters={chapters} onSeek={handleSeek} />}
          {tab === "teachme" && <TeachMeTab videoId={videoId} concepts={concepts} onStartQuiz={onStartQuiz} />}
        </div>
      </div>

      {/* Right: AI Tutor */}
      <div className="w-80 shrink-0 border-l flex flex-col" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        {/* Header */}
        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--primary)" }}>
              <Sparkles size={13} color="white" />
            </div>
            <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>AI Tutor</span>
            <span className="text-xs px-2 py-0.5 rounded-full ml-auto font-medium" style={{ background: "#DCFCE7", color: "#166534" }}>
              ● Ready
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Answers grounded in this video</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className="max-w-[92%] rounded-xl text-sm leading-relaxed p-3"
                style={{
                  background: msg.role === "user" ? "var(--primary)" : "var(--muted)",
                  color: msg.role === "user" ? "white" : "var(--foreground)",
                }}
              >
                {msg.text}
              </div>
              {msg.source && (
                <div className="flex items-center gap-2 mt-1.5 px-1">
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Based on video</span>
                  <button
                    onClick={() => handleSeek(msg.source)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium cursor-pointer hover:opacity-80 transition-all"
                    style={{ background: "var(--secondary)", color: "var(--primary)" }}
                  >
                    <Clock size={10} /> {msg.source} <ExternalLink size={10} />
                  </button>
                </div>
              )}
            </div>
          ))}
          {thinking && (
            <div className="flex items-start">
              <div className="px-4 py-3 rounded-xl" style={{ background: "var(--muted)" }}>
                <span className="inline-flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--muted-foreground)", animationDelay: `${d}ms` }} />
                  ))}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested questions */}
        <div className="px-4 pb-2">
          <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>Suggested:</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              videoDetail?.title ? `What is the main concept of ${videoDetail.title}?` : "What are the key takeaways?",
              "What did the instructor mean here?"
            ].map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="text-xs px-2.5 py-1.5 rounded-lg border transition-all hover:border-indigo-300"
                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", background: "var(--background)" }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about this video…"
              rows={2}
              className="flex-1 text-sm resize-none rounded-xl border p-3 outline-none transition-all"
              style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--foreground)" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              onClick={handleSend}
              className="p-3 rounded-xl transition-all hover:opacity-90 shrink-0"
              style={{ background: "var(--primary)", color: "white" }}
            >
              <Send size={15} />
            </button>
          </div>
          <p className="text-xs mt-2 text-center" style={{ color: "var(--muted-foreground)" }}>
            I can only answer based on this video.
          </p>
        </div>
      </div>
    </div>
  );
}
