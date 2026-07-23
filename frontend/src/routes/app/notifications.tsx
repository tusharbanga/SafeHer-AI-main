import { createFileRoute } from "@tanstack/react-router";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { PageHeader } from "@/components/safeher/page-header";
import { GlassCard } from "@/components/safeher/glass-card";
import { ShieldCheck, Route as RouteIcon, HeartHandshake, Sparkles, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — SafeHer AI" }] }),
  component: Notifs,
});
const list = [
  { icon: ShieldCheck, t: "Guardian activated", d: "5 min ago", tone: "primary" },
  { icon: RouteIcon, t: "Journey completed safely", d: "1 h ago", tone: "safe" },
  { icon: AlertTriangle, t: "SOS test triggered", d: "Yesterday", tone: "danger" },
  { icon: Sparkles, t: "Daily affirmation", d: "8:00 AM", tone: "accent" },
  { icon: HeartHandshake, t: "New self-defence lesson", d: "2 d ago", tone: "primary" },
];
function Notifs() {
  return (
    <ScreenShell>
      <PageHeader title="Notifications" subtitle="What's happened lately" />
      <div className="space-y-3">
        {list.map((n) => (
          <GlassCard key={n.t} className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl gradient-brand text-white"><n.icon className="h-5 w-5" /></div>
            <div className="flex-1"><div className="text-sm font-semibold">{n.t}</div><div className="text-xs text-muted-foreground">{n.d}</div></div>
          </GlassCard>
        ))}
      </div>
    </ScreenShell>
  );
}