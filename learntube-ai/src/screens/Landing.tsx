import { useState } from "react";
import { ArrowRight, Play, MessageSquare, Layers, Target, TrendingUp, GraduationCap, Clock, CheckCircle, Sparkles } from "lucide-react";

interface LandingProps {
  onStart: (url?: string) => void;
  onDemo: () => void;
  onLogin: () => void;
  onSignUp: () => void;
}

const steps = [
  { num: "01", title: "Add a Video", desc: "Paste any YouTube educational video or playlist URL." },
  { num: "02", title: "AI Understands", desc: "The AI reads the transcript, identifies concepts, and structures the content." },
  { num: "03", title: "Learn Interactively", desc: "Ask questions, explore concepts, and use Teach Me mode." },
  { num: "04", title: "Test & Improve", desc: "Take adaptive quizzes and get personalized review recommendations." },
];

const features = [
  {
    icon: MessageSquare,
    title: "AI Tutor",
    desc: "Ask anything about the video and get answers grounded in the actual transcript — with timestamps so you can verify every claim.",
  },
  {
    icon: Layers,
    title: "Segment Learning",
    desc: "Select any section of the video and get a deep-dive explanation of exactly what was covered in that segment.",
  },
  {
    icon: Target,
    title: "Adaptive Quiz",
    desc: "Quizzes built from the content you studied. If you struggle with a concept, the quiz adapts to give you more targeted practice.",
  },
  {
    icon: TrendingUp,
    title: "Learning Gap Detection",
    desc: "After every quiz, AI maps your weak concepts and tells you precisely what to review — and where in the video to find it.",
  },
];

export default function Landing({ onStart, onDemo, onLogin, onSignUp }: LandingProps) {
  const [url, setUrl] = useState("");

  const handleStartLearning = () => {
    if (url.trim()) {
      onStart(url.trim());
    } else {
      onSignUp();
    }
  };

  return (
    <div className="min-h-full flex flex-col" style={{ background: "#FFFFFF", fontFamily: "var(--font-body)" }}>

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderColor: "#E2E8F0" }}>
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--primary)" }}>
              <GraduationCap size={15} color="white" />
            </div>
            <span className="font-semibold" style={{ fontFamily: "var(--font-display)", color: "#0F172A", fontSize: 15 }}>
              LearnTube <span style={{ color: "var(--primary)" }}>AI</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onLogin} className="text-sm font-medium px-4 py-2 rounded-lg transition-all hover:bg-slate-50" style={{ color: "#64748B" }}>
              Log in
            </button>
            <button onClick={onSignUp} className="text-sm font-semibold px-5 py-2 rounded-lg transition-all hover:opacity-90" style={{ background: "var(--primary)", color: "white" }}>
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, #F0F4FF 0%, #F5F3FF 50%, #EEF2FF 100%)" }}>
        {/* Subtle decorative blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-40" style={{ background: "radial-gradient(circle, #E0E7FF 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, #EDE9FE 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />

        <div className="relative max-w-6xl mx-auto px-8 pt-20 pb-16">
          {/* Centered headline */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-7 text-xs font-medium border" style={{ background: "white", borderColor: "#C7D2FE", color: "#4F46E5" }}>
              <Sparkles size={12} style={{ color: "#4F46E5" }} /> AI-Powered Learning Agent
            </div>
            <h1 className="text-6xl font-bold mb-5" style={{ fontFamily: "var(--font-display)", color: "#0F172A", lineHeight: 1.1, letterSpacing: "-0.025em" }}>
              Turn YouTube Videos Into Your{" "}
              <span style={{ color: "var(--primary)" }}>Personal AI Tutor</span>
            </h1>
            <p className="text-lg mb-10" style={{ color: "#64748B", lineHeight: 1.7 }}>
              Learn, ask questions, test yourself, and discover what to improve — all from one video.
            </p>

            {/* URL Input */}
            <div className="flex gap-2 p-1.5 rounded-xl mx-auto max-w-xl mb-5 shadow-sm" style={{ background: "white", border: "1.5px solid #C7D2FE" }}>
              <div className="flex flex-1 items-center gap-3 pl-4">
                <Play size={14} style={{ color: "#A5B4FC", flexShrink: 0 }} />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste a YouTube URL…"
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "#0F172A" }}
                  onKeyDown={(e) => e.key === "Enter" && handleStartLearning()}
                />
              </div>
              <button
                onClick={handleStartLearning}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:opacity-90 shrink-0"
                style={{ background: "var(--primary)", color: "white" }}
              >
                Start Learning <ArrowRight size={14} />
              </button>
            </div>

            <button onClick={onDemo} className="inline-flex items-center gap-2 text-sm transition-all hover:opacity-70" style={{ color: "#94A3B8" }}>
              <Play size={13} style={{ color: "var(--primary)" }} />
              Try a demo — no sign-up needed
            </button>
          </div>

          {/* Product preview */}
          <div className="rounded-2xl overflow-hidden border mx-auto max-w-4xl shadow-2xl" style={{ borderColor: "#E0E7FF", background: "white" }}>
            {/* Mock toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "#F1F5F9", background: "#F8FAFC" }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#FDA4AF" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#FCD34D" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#86EFAC" }} />
              </div>
              <div className="flex-1 mx-4">
                <div className="rounded-md px-3 py-1 text-xs mx-auto w-fit" style={{ background: "#F1F5F9", color: "#94A3B8" }}>
                  learntube.ai/workspace
                </div>
              </div>
            </div>

            {/* Mock workspace */}
            <div className="flex" style={{ height: 300 }}>
              {/* Video + tabs side */}
              <div className="flex-1 border-r" style={{ borderColor: "#F1F5F9" }}>
                <div className="relative" style={{ height: 150 }}>
                  <img
                    src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=700&h=300&fit=crop&auto=format"
                    alt="Video"
                    className="w-full h-full object-cover"
                    style={{ opacity: 0.85 }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.35)" }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" }}>
                      <Play size={16} color="white" fill="white" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "#E2E8F0" }}>
                    <div className="h-full" style={{ width: "21%", background: "var(--primary)" }} />
                  </div>
                  <div className="absolute bottom-2 left-3 text-xs font-mono text-white opacity-80">09:42 / 45:32</div>
                </div>

                {/* Tabs */}
                <div className="flex border-b px-3 gap-1" style={{ borderColor: "#F1F5F9", background: "white" }}>
                  {["Summary", "Concepts", "Chapters", "Teach Me"].map((t, i) => (
                    <div key={t} className="px-3 py-2.5 text-xs border-b-2 font-medium" style={{ borderColor: i === 0 ? "var(--primary)" : "transparent", color: i === 0 ? "var(--primary)" : "#94A3B8" }}>
                      {t}
                    </div>
                  ))}
                </div>

                {/* Content skeleton */}
                <div className="p-4 space-y-2.5">
                  <div className="h-2 rounded-full w-1/3" style={{ background: "#E2E8F0" }} />
                  <div className="h-2 rounded-full w-full" style={{ background: "#F1F5F9" }} />
                  <div className="h-2 rounded-full w-5/6" style={{ background: "#F1F5F9" }} />
                  <div className="h-2 rounded-full w-2/3 mt-3" style={{ background: "#E2E8F0" }} />
                  <div className="h-2 rounded-full w-full" style={{ background: "#F1F5F9" }} />
                </div>
              </div>

              {/* AI Tutor side */}
              <div className="w-56 flex flex-col" style={{ background: "#FAFAFA" }}>
                <div className="px-3 py-3 border-b flex items-center gap-2" style={{ borderColor: "#F1F5F9", background: "white" }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--primary)" }}>
                    <Sparkles size={10} color="white" />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "#0F172A" }}>AI Tutor</span>
                  <div className="w-1.5 h-1.5 rounded-full ml-auto" style={{ background: "#22C55E" }} />
                </div>
                <div className="flex-1 p-3 space-y-3 overflow-hidden">
                  {/* AI message */}
                  <div className="rounded-xl p-2.5 text-xs leading-relaxed" style={{ background: "#F1F5F9", color: "#374151" }}>
                    Recursion is when a function calls itself with a simpler input until it reaches the base case.
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1" style={{ background: "#EEF2FF", color: "var(--primary)" }}>
                      <Clock size={9} /> 09:42
                    </div>
                    <span className="text-xs" style={{ color: "#94A3B8" }}>Based on video</span>
                  </div>
                  {/* User message */}
                  <div className="rounded-xl p-2.5 text-xs ml-4" style={{ background: "var(--primary)", color: "white" }}>
                    What is the base case?
                  </div>
                </div>
                <div className="px-3 pb-3">
                  <div className="rounded-lg px-3 py-2 text-xs border" style={{ borderColor: "#E2E8F0", color: "#CBD5E1", background: "white" }}>
                    Ask anything…
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24" style={{ background: "#FFFFFF" }}>
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--primary)" }}>How It Works</p>
            <h2 className="text-4xl font-bold" style={{ fontFamily: "var(--font-display)", color: "#0F172A", letterSpacing: "-0.02em" }}>
              From video to mastery in four steps
            </h2>
          </div>

          <div className="grid grid-cols-4 gap-8">
            {steps.map(({ num, title, desc }) => (
              <div key={num}>
                <div className="text-3xl font-bold mb-4" style={{ fontFamily: "var(--font-display)", color: "#E2E8F0" }}>{num}</div>
                <h3 className="font-semibold mb-2" style={{ color: "#0F172A" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24" style={{ background: "#F8FAFC" }}>
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--primary)" }}>What Makes It Different</p>
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-display)", color: "#0F172A", letterSpacing: "-0.02em" }}>
              Not a summarizer. An AI that actually teaches.
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: "#64748B" }}>
              Every feature is built around one goal — helping you genuinely understand and retain what you watch.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-7 rounded-2xl border bg-white transition-all hover:shadow-md hover:border-indigo-200" style={{ borderColor: "#E2E8F0" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: "#EEF2FF" }}>
                  <Icon size={18} style={{ color: "var(--primary)" }} />
                </div>
                <h3 className="font-semibold text-base mb-2" style={{ color: "#0F172A" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GROUNDING STRIP */}
      <section className="py-14 border-y" style={{ background: "#FFFFFF", borderColor: "#E2E8F0" }}>
        <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} style={{ color: "#22C55E" }} />
              <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>AI grounded in your learning content</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>
              Every answer references the actual video transcript. If something isn't in the video, LearnTube AI will tell you — no guessing, no hallucinations.
            </p>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl border shrink-0" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "#22C55E" }} />
            <span className="text-sm font-medium" style={{ color: "#0F172A" }}>Source: 09:42 — Recursion Explained</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24" style={{ background: "linear-gradient(160deg, #F0F4FF 0%, #EEF2FF 100%)" }}>
        <div className="max-w-2xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-display)", color: "#0F172A", letterSpacing: "-0.02em" }}>
            Start learning smarter today
          </h2>
          <p className="text-base mb-10" style={{ color: "#64748B" }}>
            Paste any YouTube educational video and your AI tutor is ready in seconds.
          </p>
          <div className="flex justify-center gap-3">
            <button onClick={onSignUp} className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 shadow-sm" style={{ background: "var(--primary)", color: "white" }}>
              Create Free Account <ArrowRight size={15} />
            </button>
            <button onClick={onDemo} className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border transition-all hover:bg-white" style={{ borderColor: "#C7D2FE", color: "#4F46E5", background: "white" }}>
              <Play size={13} /> Try a Demo
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-8" style={{ borderColor: "#E2E8F0", background: "#FFFFFF" }}>
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--primary)" }}>
              <GraduationCap size={13} color="white" />
            </div>
            <span className="font-semibold text-sm" style={{ fontFamily: "var(--font-display)", color: "#0F172A" }}>
              LearnTube <span style={{ color: "var(--primary)" }}>AI</span>
            </span>
            <span className="text-sm ml-3" style={{ color: "#CBD5E1" }}>— Learn smarter from the content you already watch.</span>
          </div>
          <div className="flex items-center gap-6">
            {["Home", "My Learning", "About"].map((link) => (
              <button key={link} className="text-sm transition-all hover:opacity-60" style={{ color: "#94A3B8" }}>{link}</button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
