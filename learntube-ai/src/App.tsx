import { useState } from "react";
import Navigation from "./components/Navigation";
import Landing from "./screens/Landing";
import SignUp from "./screens/SignUp";
import Login from "./screens/Login";
import Home from "./screens/Home";
import Processing from "./screens/Processing";
import Workspace from "./screens/Workspace";
import Quiz from "./screens/Quiz";
import QuizResults from "./screens/QuizResults";
import MyLearning from "./screens/MyLearning";

type Screen = "landing" | "signup" | "login" | "home" | "processing" | "workspace" | "quiz" | "results" | "learning";

const PUBLIC: Screen[] = ["landing", "signup", "login"];

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    return localStorage.getItem("learntube_token") ? "home" : "landing";
  });
  const [quizKey, setQuizKey] = useState(0);
  const [processingKey, setProcessingKey] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoId, setVideoId] = useState<string>("");
  const [quizResults, setQuizResults] = useState<any>(null);
  const [initialSeekTime, setInitialSeekTime] = useState<string | number | null>(null);

  const isPublic = PUBLIC.includes(screen);

  const navScreen =
    screen === "processing" ? "home" :
    screen === "quiz" ? "quiz" :
    screen === "results" ? "results" :
    screen === "learning" ? "learning" :
    screen as any;

  const handleStartProcessing = (url: string) => {
    setVideoUrl(url);
    setProcessingKey((k) => k + 1);
    setScreen("processing");
  };

  return (
    <div className="flex h-full" style={{ fontFamily: "var(--font-body)" }}>
      {/* Public screens — no sidebar */}
      {isPublic && (
        <div className="flex-1 overflow-y-auto">
          {screen === "landing" && (
            <Landing
              onStart={(url?: string) => {
                if (url) {
                  setVideoUrl(url);
                  if (localStorage.getItem("learntube_token")) {
                    handleStartProcessing(url);
                    return;
                  }
                }
                setScreen("signup");
              }}
              onDemo={() => handleStartProcessing("https://www.youtube.com/watch?v=ORCuz7s5cCY")}
              onLogin={() => setScreen("login")}
              onSignUp={() => setScreen("signup")}
            />
          )}
          {screen === "signup" && (
            <SignUp
              onSignUp={() => {
                if (videoUrl) {
                  handleStartProcessing(videoUrl);
                } else {
                  setScreen("home");
                }
              }}
              onLogin={() => setScreen("login")}
              onBack={() => setScreen("landing")}
            />
          )}
          {screen === "login" && (
            <Login
              onLogin={() => {
                if (videoUrl) {
                  handleStartProcessing(videoUrl);
                } else {
                  setScreen("home");
                }
              }}
              onSignUp={() => setScreen("signup")}
              onBack={() => setScreen("landing")}
            />
          )}
        </div>
      )}

      {/* Authenticated screens — with sidebar */}
      {!isPublic && (
        <>
          <Navigation
            currentScreen={navScreen}
            onLogout={() => {
              localStorage.removeItem("learntube_token");
              setScreen("landing");
            }}
            onDemo={() => handleStartProcessing("https://www.youtube.com/watch?v=ORCuz7s5cCY")}
            onNavigate={(s) => {
              if (s === "home") setScreen("home");
              else if (s === "learning") setScreen("learning");
              else if (s === "workspace") setScreen("workspace");
              else if (s === "processing") setScreen("processing");
            }}
          />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {screen === "home" && (
              <Home
                onStart={handleStartProcessing}
                onDemo={() => handleStartProcessing("https://www.youtube.com/watch?v=rfscVS0vtbw")}
              />
            )}
            {screen === "processing" && (
              <Processing
                key={processingKey}
                url={videoUrl}
                onComplete={(vid) => {
                  setVideoId(vid);
                  setScreen("workspace");
                }}
              />
            )}
            {screen === "workspace" && (
              <Workspace
                videoId={videoId}
                initialSeekTime={initialSeekTime}
                onStartQuiz={() => setScreen("quiz")}
              />
            )}
            {screen === "quiz" && (
              <Quiz
                key={quizKey}
                videoId={videoId}
                onComplete={(results) => {
                  setQuizResults(results);
                  setScreen("results");
                }}
                onBack={() => setScreen("workspace")}
              />
            )}
            {screen === "results" && (
              <QuizResults
                results={quizResults}
                onReview={(ts) => {
                  if (ts) setInitialSeekTime(ts);
                  setScreen("workspace");
                }}
                onRetry={() => {
                  setQuizKey((k) => k + 1);
                  setScreen("quiz");
                }}
              />
            )}
            {screen === "learning" && (
              <MyLearning
                onContinue={(selectedVid?: string) => {
                  if (selectedVid) setVideoId(selectedVid);
                  setScreen("workspace");
                }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
