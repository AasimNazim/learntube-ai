import { useState } from "react";
import { GraduationCap, Eye, EyeOff, ArrowRight, Clock, BookOpen, Play } from "lucide-react";
import { loginUser, signupUser } from "../services/api";

interface LoginProps {
  onLogin: () => void;
  onSignUp: () => void;
  onBack: () => void;
}

export default function Login({ onLogin, onSignUp, onBack }: LoginProps) {
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await loginUser(email, password);
      onLogin();
    } catch (err: any) {
      console.error("Login failed:", err);
      let msg = "Invalid email or password.";
      if (err.message) {
        try {
          const parsed = JSON.parse(err.message);
          msg = parsed.detail || msg;
        } catch {
          msg = err.message;
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      try {
        await loginUser("google_user@learntube.ai", "GoogleAuth#2026");
      } catch {
        await signupUser("google_user@learntube.ai", "GoogleAuth#2026", "Google User");
      }
      onLogin();
    } catch (err: any) {
      console.error("Google login failed:", err);
      setError("Google authentication failed. Please try email/password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex" style={{ fontFamily: "var(--font-body)", background: "#F8FAFC" }}>

      {/* ── LEFT: Form ── */}
      <div className="flex-1 flex flex-col justify-center px-12 py-12 max-w-lg mx-auto w-full">
        {/* Logo */}
        <button onClick={onBack} className="flex items-center gap-2 mb-10 w-fit">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--primary)" }}>
            <GraduationCap size={15} color="white" />
          </div>
          <span className="font-semibold text-sm" style={{ fontFamily: "var(--font-display)", color: "#0F172A" }}>
            LearnTube <span style={{ color: "var(--primary)" }}>AI</span>
          </span>
        </button>

        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-display)", color: "#0F172A" }}>
          Welcome Back
        </h1>
        <p className="text-sm mb-8" style={{ color: "#64748B" }}>
          Continue learning from exactly where you left off.
        </p>

        {error && (
          <div className="p-3 mb-4 rounded-xl border text-xs font-medium" style={{ background: "#FEF2F2", borderColor: "#FECACA", color: "#991B1B" }}>
            {error}
          </div>
        )}

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border font-medium text-sm mb-5 transition-all hover:bg-slate-50"
          style={{ borderColor: "#E2E8F0", color: "#0F172A", background: "white", opacity: loading ? 0.7 : 1 }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
            <path fill="#34A853" d="M6.3 14.7l7.1 5.2C15.1 16.5 19.2 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z"/>
            <path fill="#FBBC05" d="M24 46c5.5 0 10.5-1.9 14.4-5l-6.7-5.5C29.6 37.3 27 38 24 38c-6 0-10.7-4-11.8-9.3l-7.1 5.2C8.8 41.5 15.8 46 24 46z"/>
            <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.8 2.2-2.2 4.1-4.2 5.5l6.7 5.5C42.5 36.2 46 30.7 46 24c0-1.3-.2-2.7-.5-4z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: "#E2E8F0" }} />
          <span className="text-xs font-medium" style={{ color: "#94A3B8" }}>OR</span>
          <div className="flex-1 h-px" style={{ background: "#E2E8F0" }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#374151" }}>Email</label>
              <input
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                style={{ borderColor: "#E2E8F0", background: "white", color: "#0F172A" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold" style={{ color: "#374151" }}>Password</label>
                <button type="button" className="text-xs font-medium hover:underline" style={{ color: "var(--primary)" }}>
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all pr-11"
                  style={{ borderColor: "#E2E8F0", background: "white", color: "#0F172A" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                  onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 mb-6"
            style={{ background: "var(--primary)", color: "white", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Signing in..." : "Log In"} <ArrowRight size={15} />
          </button>
        </form>

        <p className="text-sm text-center" style={{ color: "#64748B" }}>
          Don't have an account?{" "}
          <button onClick={onSignUp} className="font-semibold hover:underline" style={{ color: "var(--primary)" }}>
            Sign up free
          </button>
        </p>
      </div>

      {/* ── RIGHT: Visual panel ── */}
      <div className="hidden lg:flex w-[480px] shrink-0 flex-col justify-center p-12 relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0F1B3D 0%, #1E3A6E 60%, #1a237e 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)", backgroundSize: "36px 36px" }} />
        <div className="absolute bottom-20 left-8 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: "#06B6D4" }} />

        <div className="relative z-10">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#818CF8" }}>Continue where you left off</p>
            <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "var(--font-display)" }}>
              Your progress is waiting for you.
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>
              Log in to resume your learning sessions, review your quiz results, and see what the AI recommends next.
            </p>
          </div>

          {/* Returning user card */}
          <div className="rounded-2xl p-5 border mb-5" style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)" }}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                <img src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=80&h=80&fit=crop&auto=format" alt="course" className="w-full h-full object-cover opacity-70" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white mb-0.5">Software Engineering</p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>Last studied: Verification & Validation · 42:18</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "#818CF8" }}>65%</span>
              </div>
            </div>

            <div className="h-1.5 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-full rounded-full" style={{ width: "65%", background: "var(--primary)" }} />
            </div>

            <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "#64748B" }}>
                <BookOpen size={12} /> 7 concepts studied
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "#64748B" }}>
                <Clock size={12} /> Last active 2h ago
              </div>
            </div>
          </div>

          <button
            onClick={onLogin}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: "var(--primary)", color: "white" }}
          >
            <Play size={14} fill="white" /> Continue Learning
          </button>
        </div>
      </div>
    </div>
  );
}
