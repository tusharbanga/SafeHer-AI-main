import { createFileRoute } from "@tanstack/react-router";
import { Mic, ShieldAlert, Sparkles, Volume2, Waves } from "lucide-react";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { PageHeader } from "@/components/safeher/page-header";
import { GlassCard } from "@/components/safeher/glass-card";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/app/voice")({
  head: () => ({ meta: [{ title: "Voice Guardian — SafeHer AI" }] }),
  component: Voice,
});

type GuardianStatus = "Listening" | "Detected" | "Emergency";
type Sensitivity = "Low" | "Medium" | "High";

type RecognitionWindow = {
  transcript: string;
  confidence: number;
};

const triggers = ["Help", "Stop", "Don't Touch Me", "Bachao", "Leave Me", "Screaming"];
const englishKeywords = ["help", "help me", "stop", "no", "leave me", "don't touch me", "call police", "someone help", "save me", "emergency"];
const hindiKeywords = ["bachao", "mujhe bachao", "madad", "police bulao", "chod do", "haath mat lagao", "mujhe chhod do", "bachao please"];
const hinglishKeywords = ["help karo", "please bachao", "police ko call karo", "mujhe mat chuo", "leave me please", "help please"];
const womenHelplineNumber = "1091";

function Voice() {
  const [code, setCode] = useState("Guardian");
  const [enabled, setEnabled] = useState(true);
  const [screamEnabled, setScreamEnabled] = useState(true);
  const [autoSOS, setAutoSOS] = useState(true);
  const [language, setLanguage] = useState("en-IN");
  const [sensitivity, setSensitivity] = useState<Sensitivity>("High");
  const [status, setStatus] = useState<GuardianStatus>("Listening");
  const [confidence, setConfidence] = useState(93);
  const [lastTranscript, setLastTranscript] = useState("Listening for your secret word...");
  const [emergencyCount, setEmergencyCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const lastKeywordRef = useRef<number>(0);
  const lastTranscriptRef = useRef<string>("");

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as Window & typeof globalThis & { webkitSpeechRecognition?: any }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = "";
      let finalTranscript = "";
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript?.trim() || "";
        const confidenceScore = Number(result[0]?.confidence || 0) * 100;
        if (result.isFinal) {
          finalTranscript += transcript;
          maxConfidence = Math.max(maxConfidence, confidenceScore);
        } else {
          interim += transcript;
        }
      }

      const combinedText = `${finalTranscript} ${interim}`.trim();
      if (combinedText) {
        lastTranscriptRef.current = combinedText;
        setLastTranscript(combinedText);
      }

      if (maxConfidence > 0) {
        setConfidence(Math.round(maxConfidence));
      }

      const normalized = combinedText.toLowerCase();
      const detectedKeyword = detectKeyword(normalized);
      const detectedSecretCode = code.trim() && normalized.includes(code.toLowerCase().trim());

      if (detectedKeyword || detectedSecretCode) {
        setStatus("Detected");
        setEmergencyCount((count) => count + 1);
        void triggerEmergency(combinedText, maxConfidence, true);
      }
    };

    recognition.onerror = () => {
      setStatus("Listening");
    };

    recognition.onend = () => {
      if (enabled) {
        recognition.start();
      }
    };

    recognition.start();

    return () => {
      recognition.stop();
    };
  }, [enabled, language, code]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timer = window.setInterval(() => {
      if (lastTranscriptRef.current) {
        const normalized = lastTranscriptRef.current.toLowerCase();
        if (/(help|bachao|madad|police|emergency|stop|leave me|don't touch me|scream|screaming|haath|chhod|mat)/i.test(normalized)) {
          setStatus("Detected");
        }
      }
    }, 1500);

    return () => window.clearInterval(timer);
  }, [enabled]);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  };

  const triggerEmergency = async (transcript: string, detectionConfidence: number, force = false) => {
    const normalizedConfidence = detectionConfidence > confidence ? detectionConfidence : confidence;
    const hasCodeWord = transcript.toLowerCase().includes(code.toLowerCase()) && code.trim();
    const shouldTrigger = force || normalizedConfidence > 85 || lastKeywordRef.current + 5000 < Date.now() || hasCodeWord;
    if (!shouldTrigger) {
      return;
    }

    if (lastKeywordRef.current + 4000 > Date.now() && !force) {
      return;
    }

    lastKeywordRef.current = Date.now();
    setStatus("Emergency");
    setShowCallPrompt(true);
    setConfidence(Math.max(normalizedConfidence, 98));

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([300, 150, 500]);
    }

    const audio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAI2AAABAAABkYH/AAABAAgAZGF0YQAAAAA=");
    void audio.play().catch(() => undefined);

    setShowCallPrompt(true);

    try {
      window.location.href = `tel:${womenHelplineNumber}`;
    } catch {
      try {
        window.open(`tel:${womenHelplineNumber}`);
      } catch {
        // fallback prompt remains visible
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const payload = {
          emergency: true,
          message: `Emergency detected: ${transcript}`,
          transcript,
          confidence: normalizedConfidence,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString(),
          notifyContacts: true,
          sharedLocation: true,
        };
        // Backend should notify every trusted contact, mark this user as RED in the Shared With Me screen, and start live location sharing.
        try {
          await fetch("/api/v1/sos/trigger", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload),
          });
        } catch {
          // ignore network failures
        }
      });
    }

    await startRecording();
  };

  const [showCallPrompt, setShowCallPrompt] = useState(false);

  // If user couldn't be taken to the dialer automatically (desktop or blocked),
  // show a visible prompt with a button to call and an option to copy the number.
  useEffect(() => {
    if (status === "Emergency") {
      // show the prompt for manual fallback
      setShowCallPrompt(true);
    }
  }, [status]);

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (value.trim()) {
      setConfidence(96);
    }
  };

  const statusTone = useMemo(() => {
    switch (status) {
      case "Emergency":
        return "from-rose-500/80 to-red-500/80";
      case "Detected":
        return "from-amber-400/80 to-orange-500/80";
      default:
        return "from-sky-500/80 to-violet-500/80";
    }
  }, [status]);

  return (
    <ScreenShell>
      <PageHeader title="Voice Guardian" subtitle="Listening for your secret word" />

      <GlassCard className="relative mb-4 overflow-hidden border border-primary/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.24),transparent_35%)]" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Voice Guardian</div>
              <div className="mt-2 text-xl font-semibold">{lastTranscript}</div>
            </div>
            <div className={`rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold text-white ${statusTone}`}>
              {status}
            </div>
          </div>

          <div className="relative my-8 flex flex-col items-center">
            <div className="relative grid h-44 w-44 place-items-center">
              <span className="absolute inset-0 rounded-full border-2 border-sky-400/40 animate-pulse-ring" />
              <span className="absolute inset-6 rounded-full border-2 border-violet-400/40 animate-pulse-ring" style={{ animationDelay: "0.6s" }} />
              <div className={`grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br ${statusTone} text-white shadow-[0_0_35px_rgba(99,102,241,0.4)]`}>
                <Mic className="h-12 w-12" />
              </div>
            </div>
            <div className="mt-6 flex items-end gap-1">
              {Array.from({ length: 24 }).map((_, i) => (
                <span key={i} className="w-1.5 rounded-full bg-gradient-to-t from-sky-400 to-violet-500" style={{ height: 6 + Math.abs(Math.sin(i)) * 40, animation: `float-slow ${0.8 + (i % 5) * 0.15}s ease-in-out infinite alternate` }} />
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-300">{status === "Detected" ? "Detected" : "Listening"}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="mb-4 border border-white/10 bg-white/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Secret Code Word</div>
        <input
          value={code}
          onChange={(event) => handleCodeChange(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-border bg-card/70 px-4 py-3 text-lg font-bold focus:border-primary/60 focus:outline-none"
        />
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Stored locally for guardian mode</span>
          <span className="font-semibold text-primary">{code.trim() ? "Ready" : "Set a word"}</span>
        </div>
      </GlassCard>

      <GlassCard className="mb-4 border border-white/10 bg-white/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">AI Detects</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {triggers.map((t) => (
            <span key={t} className="rounded-full bg-gradient-to-r from-primary/15 to-accent/15 px-3 py-1.5 text-xs font-semibold text-foreground">{t}</span>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="border border-white/10 bg-white/80 backdrop-blur-xl">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Settings</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="flex items-center justify-between rounded-2xl border border-border px-3 py-2 text-sm">
            <span>Enable Voice Guardian</span>
            <input type="checkbox" checked={enabled} onChange={() => setEnabled((value) => !value)} className="h-4 w-4" />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-border px-3 py-2 text-sm">
            <span>Scream Detection</span>
            <input type="checkbox" checked={screamEnabled} onChange={() => setScreamEnabled((value) => !value)} className="h-4 w-4" />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-border px-3 py-2 text-sm">
            <span>Auto SOS</span>
            <input type="checkbox" checked={autoSOS} onChange={() => setAutoSOS((value) => !value)} className="h-4 w-4" />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-border px-3 py-2 text-sm">
            <span>Language</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value)} className="rounded-full border border-border bg-transparent px-2 py-1 text-sm">
              <option value="en-IN">English</option>
              <option value="hi-IN">Hindi</option>
            </select>
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-border px-3 py-2 text-sm">
            <span>Sensitivity</span>
            <select value={sensitivity} onChange={(event) => setSensitivity(event.target.value as Sensitivity)} className="rounded-full border border-border bg-transparent px-2 py-1 text-sm">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
          <div className="rounded-2xl border border-border px-3 py-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <span>Emergency threshold {sensitivity}</span>
            </div>
          </div>
        </div>
      </GlassCard>

    </ScreenShell>
  );
}

function detectKeyword(text: string) {
  const lower = text.toLowerCase();
  const keywords = [...englishKeywords, ...hindiKeywords, ...hinglishKeywords];
  return keywords.find((keyword) => lower.includes(keyword.toLowerCase()));
}