import { createFileRoute } from "@tanstack/react-router";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { PageHeader } from "@/components/safeher/page-header";
import { Mic, ImagePlus, Send, Sparkles } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export const Route = createFileRoute("/app/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — SafeHer AI" }] }),
  component: Assistant,
});
const suggestions = ["I'm scared.", "Someone is following me.", "I need legal help.", "Nearest police station.", "Teach me self defence."];

type Message = {
  id: number;
  side: "ai" | "me";
  text: string;
};

function Assistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const savedConversationId = window.localStorage.getItem("safeher-ai-conversation-id");
    if (savedConversationId) {
      setConversationId(savedConversationId);
    }

    try {
      const stored = window.localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserName(parsed?.name ?? "");
      }
    } catch {
      setUserName("");
    }
  }, []);

  useEffect(() => {
    // initialize greeting
    const name = userName && userName.trim() ? userName : "";
    const greeting = name ? `Hi ${name} 💜 I'm here. Tell me what you need — I can guide you, call for help, or just listen.` : "Hi — I'm here. Tell me what you need — I can guide you, call for help, or just listen.";
    setMessages([{ id: 1, side: "ai", text: greeting }]);
  }, [userName]);

  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;

    const userMessage = text.trim();
    const nextMessages = [...messages, { id: Date.now(), side: "me" as const, text: userMessage }];
    setMessages(nextMessages);
    setDraft("");
    setIsSending(true);

    try {
      const response = await fetch("/api/v1/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: conversationId ?? "",
          location: {},
          language: "",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Unable to reach SafeHer AI");
      }

      const aiReply = data?.data?.reply || data?.reply || "I'm here with you.";
      const nextConversationId = data?.data?.conversationId || conversationId;
      if (nextConversationId) {
        window.localStorage.setItem("safeher-ai-conversation-id", nextConversationId);
        setConversationId(nextConversationId);
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();

        const utterance = new window.SpeechSynthesisUtterance(aiReply);
        utterance.lang = "en-IN";
        utterance.rate = 1;
        utterance.pitch = 1.3;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoiceNames = [
          "Microsoft Zira",
          "Microsoft Aria",
          "Google UK English Female",
          "Samantha",
          "Karen",
          "Moira",
          "Veena",
        ];

        const femaleVoice =
          preferredVoiceNames
            .map(name => voices.find(v => v.name.includes(name)))
            .find(Boolean) ||
          voices.find(v => /female/i.test(v.name)) ||
          voices.find(v => v.lang === "en-IN") ||
          voices.find(v => v.lang.startsWith("en"));

        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }

        window.speechSynthesis.speak(utterance);
      }

      setMessages([...nextMessages, { id: Date.now() + 1, side: "ai", text: aiReply }]);
    } catch {
      setMessages([...nextMessages, { id: Date.now() + 2, side: "ai", text: "I'm here with you. Please try again in a moment." }]);
    } finally {
      setIsSending(false);
    }
  };

  const startVoiceChat = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition || isListening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = async (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (!transcript) return;

      await sendMessage(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <ScreenShell>
      <PageHeader title="AI Assistant" subtitle="Always here for you" />
      <div className="flex flex-col gap-3" style={{ height: '60vh' }}>
        <div className="flex-1 overflow-auto">
          <div className="space-y-3 px-1">
            {messages.map((message) => (
              <Bubble key={message.id} side={message.side}>{message.text}</Bubble>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button key={s} onClick={() => sendMessage(s)} className="rounded-full glass px-3 py-1.5 text-xs font-semibold shadow-soft">
            <Sparkles className="mr-1 inline h-3 w-3 text-primary" />{s}
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-full glass p-2 shadow-soft">
        <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { void sendMessage(draft); } }} placeholder="Message SafeHer AI…" className="flex-1 bg-transparent px-2 text-sm focus:outline-none" />
        <MicButton onClick={startVoiceChat} listening={isListening} />
        <button onClick={() => void sendMessage(draft)} className="grid h-10 w-10 place-items-center rounded-full gradient-brand text-white shadow-glow"><Send className="h-4 w-4" /></button>
      </div>
    </ScreenShell>
  );
}
function Bubble({ side, children }: { side: "ai" | "me"; children: React.ReactNode }) {
  const mine = side === "me";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm shadow-soft ${mine ? "gradient-brand text-white" : "glass"}`}>{children}</div>
    </div>
  );
}

function MicButton({ onClick, listening = false }: { onClick: () => void; listening?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid h-10 w-10 place-items-center rounded-full transition ${listening ? "gradient-brand text-white animate-pulse" : "bg-muted"}`}
    >
      <Mic className="h-4 w-4" />
    </button>
  );
}