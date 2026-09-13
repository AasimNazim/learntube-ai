import { BookOpen, Home, GraduationCap, ChevronRight, Play, LogOut } from "lucide-react";

type Screen = "home" | "processing" | "workspace" | "results" | "learning" | "quiz";

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  onDemo?: () => void;
}

const navItems = [
  { id: "home" as Screen, label: "Home", icon: Home },
  { id: "learning" as Screen, label: "My Learning", icon: BookOpen },
];

export default function Navigation({ currentScreen, onNavigate, onLogout, onDemo }: NavigationProps) {
  return (
    <aside className="w-60 shrink-0 flex flex-col border-r" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--primary)" }}>
            <GraduationCap size={16} color="white" />
          </div>
          <span className="font-semibold text-sm" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
            LearnTube <span style={{ color: "var(--primary)" }}>AI</span>
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active =
            currentScreen === id ||
            (id === "home" && (currentScreen === "processing")) ||
            (id === "learning" && (currentScreen === "results"));
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
              style={{
                background: active ? "var(--secondary)" : "transparent",
                color: active ? "var(--primary)" : "var(--muted-foreground)",
              }}
            >
              <Icon size={16} />
              {label}
              {active && <ChevronRight size={13} className="ml-auto opacity-50" />}
            </button>
          );
        })}

        {/* Workspace — only visible when inside it */}
        {(currentScreen === "workspace" || currentScreen === "quiz") && (
          <button
            onClick={() => onNavigate("workspace")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
            style={{ background: "var(--secondary)", color: "var(--primary)" }}
          >
            <GraduationCap size={16} />
            Workspace
            <ChevronRight size={13} className="ml-auto opacity-50" />
          </button>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 mb-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-red-50"
          style={{ color: "#EF4444" }}
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>

      {/* Demo shortcut */}
      <div className="mx-3 mb-4 p-4 rounded-xl border" style={{ background: "var(--muted)", borderColor: "var(--border)" }}>
        <p className="text-xs font-semibold mb-1" style={{ color: "var(--foreground)" }}>Try a Demo</p>
        <p className="text-xs mb-3 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>See how LearnTube AI teaches from a Python tutorial.</p>
        <button
          onClick={() => (onDemo ? onDemo() : onNavigate("processing"))}
          className="w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          <Play size={11} fill="white" /> Launch Demo
        </button>
      </div>
    </aside>
  );
}
