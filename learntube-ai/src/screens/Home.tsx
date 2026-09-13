import { useState } from "react";
import { ArrowRight, Play, Zap, Brain, Target, BookOpen, TrendingUp, Clock, CheckCircle, Sparkles, ChevronRight } from "lucide-react";

interface HomeProps {
  onStart: (url: string) => void;
  onDemo: () => void;
}

const differentiators = [
  { icon: Clock, title: "Timestamped AI Answers", desc: "Every answer links directly to the exact moment in the video where it was explained." },
  { icon: Brain, title: "Teach Me Mode", desc: "Step-by-step AI explanations that progressively build understanding of any concept." },
  { icon: Target, title: "Adaptive Quizzes", desc: "Quizzes that adjust difficulty based on your performance and target your weak spots." },
  { icon: TrendingUp, title: "Learning Gap Detection", desc: "AI identifies exactly which concepts you haven't mastered yet." },
  { icon: BookOpen, title: "Segment Learning", desc: "Select any part of the video and get a deep-dive explanation of just that section." },
  { icon: Zap, title: "Personalized Review", desc: "Get a curated review plan based on your quiz results and learning gaps." },
];

const steps = [
  { num: "01", title: "Add a YouTube Video", desc: "Paste any educational YouTube video or playlist URL." },
  { num: "02", title: "AI Understands It", desc: "Our AI agent reads the transcript, identifies concepts, and structures the content." },
  { num: "03", title: "Learn & Ask Questions", desc: "Watch the video with an AI Tutor that answers any question with timestamped evidence." },
  { num: "04", title: "Test & Improve", desc: "Take adaptive quizzes, find your gaps, and get personalized review recommendations." },
];

export default function Home({ onStart, onDemo }: HomeProps) {
  const [url, setUrl] = useState("");
  const [inputError, setInputError] = useState(false);

  const handleStart = () => {
    if (!url.trim()) {
      setInputError(true);
      return;
    }
    setInputError(false);
    onStart(url.trim());
  };

  const handleSample = (sampleUrl: string) => {
    setUrl(sampleUrl);
    setInputError(false);
    onStart(sampleUrl);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header bar */}
      <header className="border-b px-8 py-4 sticky top-0 z-10" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <h1 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Home</h1>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
            <Sparkles size={13} />
            AI-Powered Learning Agent
          </div>
          <h1 className="text-5xl font-bold mb-5 leading-tight" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>
            Turn YouTube Videos Into<br />
            <span style={{ color: "var(--primary)" }}>Your Personal AI Tutor</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: "var(--muted-foreground)", lineHeight: 1.7 }}>
            From any YouTube video to a full learning session — watch, understand, and actually retain it.
          </p>

          {/* URL Input */}
          <div className="max-w-2xl mx-auto mb-4">
            <div className="flex gap-3 p-2 rounded-2xl border shadow-lg" style={{ background: "var(--card)", borderColor: inputError ? "#EF4444" : "var(--border)" }}>
              <div className="flex-1 flex items-center gap-3 px-4">
                <Play size={18} style={{ color: "var(--muted-foreground)" }} />
                <input
                  type="text"
                  placeholder="Paste any YouTube video or playlist URL…"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (inputError) setInputError(false);
                  }}
                  className="flex-1 outline-none text-sm bg-transparent"
                  style={{ color: "var(--foreground)" }}
                  onKeyDown={(e) => e.key === "Enter" && handleStart()}
                />
              </div>
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                Start Learning
                <ArrowRight size={16} />
              </button>
            </div>
            {inputError && (
              <p className="text-xs mt-2 text-left px-2" style={{ color: "#EF4444" }}>
                Please enter a valid YouTube video URL to begin.
              </p>
            )}
          </div>

          {/* Quick sample videos */}
          <div className="flex items-center justify-center gap-3 flex-wrap mt-6">
            <span className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>Try sample videos:</span>
            <button
              onClick={() => handleSample("https://www.youtube.com/watch?v=ORCuz7s5cCY")}
              className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:bg-slate-50 font-medium"
              style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              🐍 Python Programming
            </button>
            <button
              onClick={() => handleSample("https://www.youtube.com/watch?v=Gv9_4yMHFhI")}
              className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:bg-slate-50 font-medium"
              style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              🤖 Machine Learning
            </button>
            <button
              onClick={() => handleSample("https://www.youtube.com/watch?v=w7ejDZ8SWv8")}
              className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:bg-slate-50 font-medium"
              style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              ⚛️ React Web Dev
            </button>
          </div>
        </div>

        {/* Workflow visual */}
        <div className="rounded-2xl p-8 mb-16" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-6 text-center" style={{ color: "var(--muted-foreground)" }}>The Learning Loop</p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            {["YouTube Video", "AI Understanding", "AI Tutor", "Quiz", "Gap Detection", "Personalized Review", "Improve"].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-1" style={{ background: i === 0 ? "#FF0000" : i < 3 ? "var(--secondary)" : i < 5 ? "#FEF3C7" : "var(--secondary)", color: i === 0 ? "white" : i < 3 ? "var(--primary)" : i < 5 ? "#92400E" : "var(--primary)" }}>
                    {i + 1}
                  </div>
                  <p className="text-xs font-medium whitespace-nowrap" style={{ color: "var(--foreground)" }}>{step}</p>
                </div>
                {i < arr.length - 1 && <div className="w-4 h-px" style={{ background: "var(--border)" }} />}
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-2 text-center" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>How It Works</h2>
          <p className="text-center mb-10 text-sm" style={{ color: "var(--muted-foreground)" }}>Four steps to a deeper understanding of any educational video.</p>
          <div className="grid grid-cols-2 gap-5">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="p-6 rounded-2xl flex gap-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <span className="text-3xl font-bold leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--border)" }}>{num}</span>
                <div>
                  <h3 className="font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>{title}</h3>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)", lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Differentiators */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-2 text-center" style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}>What Makes It Different</h2>
          <p className="text-center mb-10 text-sm" style={{ color: "var(--muted-foreground)" }}>Not a summarizer. Not a chatbot. A complete AI learning agent.</p>
          <div className="grid grid-cols-3 gap-4">
            {differentiators.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-5 rounded-2xl group hover:shadow-md transition-all" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--secondary)" }}>
                  <Icon size={18} style={{ color: "var(--primary)" }} />
                </div>
                <h3 className="font-semibold text-sm mb-2" style={{ color: "var(--foreground)" }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA bottom */}
        <div className="rounded-2xl p-10 text-center" style={{ background: "var(--primary)" }}>
          <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "var(--font-display)" }}>Ready to learn smarter?</h2>
          <p className="text-sm mb-6 opacity-80 text-white">Paste any YouTube educational video and your AI tutor is ready in seconds.</p>
          <div className="flex justify-center gap-3">
            <button onClick={handleStart} className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-white transition-all hover:opacity-90" style={{ color: "var(--primary)" }}>
              Start Learning Now <ArrowRight size={16} />
            </button>
            <button onClick={onDemo} className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border border-white/30 text-white transition-all hover:bg-white/10">
              <Play size={15} /> Try the Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
