import { createFileRoute } from "@tanstack/react-router";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { PageHeader } from "@/components/safeher/page-header";
import { GlassCard } from "@/components/safeher/glass-card";
import { Hospital, Shield, Train, Pill, MapPin } from "lucide-react";

export const Route = createFileRoute("/app/heatmap")({
  head: () => ({ meta: [{ title: "Crime Heatmap — SafeHer AI" }] }),
  component: HeatMap,
});

const places = [
  { icon: Shield, label: "Bandra Police Stn", d: "0.4 km" },
  { icon: Hospital, label: "Lilavati Hospital", d: "1.1 km" },
  { icon: Train, label: "Bandra Metro", d: "0.8 km" },
  { icon: Pill, label: "24×7 Pharmacy", d: "0.3 km" },
  { icon: MapPin, label: "Safe Café Point", d: "0.2 km" },
];

function HeatMap() {
  return (
    <ScreenShell>
      <PageHeader title="Crime Heatmap" subtitle="Live zones near you" />
      <GlassCard className="mb-4 h-64 overflow-hidden p-0">
        <div className="relative h-full w-full aurora-bg">
          {[
            { l: "10%", t: "20%", c: "oklch(0.72 0.17 155 / 0.55)", s: 90 },
            { l: "60%", t: "30%", c: "oklch(0.78 0.18 75 / 0.55)", s: 110 },
            { l: "35%", t: "60%", c: "oklch(0.62 0.25 25 / 0.55)", s: 130 },
            { l: "75%", t: "70%", c: "oklch(0.72 0.17 155 / 0.5)", s: 80 },
          ].map((z, i) => (
            <span key={i} className="absolute rounded-full blur-2xl" style={{ left: z.l, top: z.t, width: z.s, height: z.s, background: z.c }} />
          ))}
          <span className="absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full gradient-brand text-white shadow-glow">
            <MapPin className="h-4 w-4" />
          </span>
        </div>
      </GlassCard>
      <div className="mb-4 flex gap-3 text-xs">
        <Legend color="var(--color-safe)" label="Safe" />
        <Legend color="var(--color-warn)" label="Caution" />
        <Legend color="var(--color-danger)" label="Avoid" />
      </div>
      <h2 className="mb-2 text-sm font-bold">Nearby safe spots</h2>
      <div className="space-y-2">
        {places.map((p) => (
          <GlassCard key={p.label} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl gradient-brand text-white"><p.icon className="h-5 w-5" /></div>
              <div className="font-semibold text-sm">{p.label}</div>
            </div>
            <div className="text-xs text-muted-foreground">{p.d}</div>
          </GlassCard>
        ))}
      </div>
    </ScreenShell>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  return <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />{label}</div>;
}