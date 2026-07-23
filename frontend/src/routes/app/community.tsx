import { createFileRoute } from "@tanstack/react-router";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { PageHeader } from "@/components/safeher/page-header";
import { GlassCard } from "@/components/safeher/glass-card";
import { Users, Footprints, Plane, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/app/community")({
  head: () => ({ meta: [{ title: "Community — SafeHer AI" }] }),
  component: Community,
});
function Community() {
  return (
    <ScreenShell>
      <PageHeader title="Community" subtitle="A sisterhood you can trust" />
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card icon={Users} t="Nearby verified" v="24 women" />
        <Card icon={Footprints} t="Walking groups" v="3 tonight" />
        <Card icon={Plane} t="Travel groups" v="Delhi · 8" />
        <Card icon={ShieldAlert} t="Anon report" v="Tap to file" />
      </div>
      <h2 className="mb-2 text-sm font-bold">Trusted circle</h2>
      <div className="space-y-3">
        {["Priya · 0.3 km", "Neha · 0.6 km", "Anjali · 1.1 km"].map((n) => (
          <GlassCard key={n} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full gradient-brand" />
            <div className="flex-1 text-sm font-semibold">{n}</div>
            <button className="rounded-full glass px-3 py-1.5 text-xs font-semibold shadow-soft">Ping</button>
          </GlassCard>
        ))}
      </div>
    </ScreenShell>
  );
}
function Card({ icon: Icon, t, v }: { icon: typeof Users; t: string; v: string }) {
  return (
    <GlassCard className="p-4">
      <div className="mb-2 grid h-10 w-10 place-items-center rounded-2xl gradient-brand text-white"><Icon className="h-5 w-5" /></div>
      <div className="text-xs text-muted-foreground">{t}</div>
      <div className="text-sm font-bold">{v}</div>
    </GlassCard>
  );
}