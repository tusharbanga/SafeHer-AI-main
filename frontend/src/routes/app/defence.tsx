import { createFileRoute } from "@tanstack/react-router";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { PageHeader } from "@/components/safeher/page-header";
import { GlassCard } from "@/components/safeher/glass-card";
import { Volume2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/defence")({
  head: () => ({ meta: [{ title: "Self Defence Coach — SafeHer AI" }] }),
  component: Defence,
});

function Defence() {
  const [situation, setSituation] = useState("");
  const [advice, setAdvice] = useState("");
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const askCoach = async () => {
    if (!situation.trim()) return;

    setLoading(true);
    setAdvice("");
    setActions("");

    try {
      const res = await fetch('/api/v1/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are an expert women self-defence instructor. A woman says: "${situation}". Explain the safest response in simple language. Give immediate actions, what to avoid, when to call emergency services, and confidence tips. Use short bullet points.`
        })
      });

      const data = await res.json();
      setAdvice(data.data?.reply || data.reply || data.message || data.response || 'No response received.');
      setActions(data.data?.actions || []);
    } catch {
      setAdvice('Unable to contact the AI coach. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell>
      <PageHeader title="AI Self Defence" />

      <GlassCard className="mb-4 p-5">
        <h3 className="text-lg font-semibold">Describe Your Situation</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Example: Someone is following me at night, a cab driver changed the route, someone grabbed my wrist, or I feel unsafe in a parking area.
        </p>

        <textarea
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          rows={2}
          placeholder="Describe what is happening..."
          className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm outline-none"
        />

        <button
          onClick={askCoach}
          disabled={loading}
          className="mt-4 w-full rounded-xl gradient-brand py-3 font-semibold text-white shadow-glow"
        >
          {loading ? 'AI is thinking...' : 'Get AI Safety Advice'}
        </button>
      </GlassCard>

      <GlassCard className="mb-4 p-4 whitespace-pre-wrap">
        <h3 className="mb-3 text-lg font-semibold">AI Coach Advice</h3>
        <div className="text-sm leading-5 [&>br]:hidden">{advice}</div>

        {actions.length > 0 && (
          <div className="mt-2 space-y-1">
            {actions.map((action, index) => (
              <div key={index} className="rounded-xl bg-white/5 p-1.5 text-sm leading-5">
                ✅ {action}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </ScreenShell>
  );
}