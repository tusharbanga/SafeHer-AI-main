import { createFileRoute } from "@tanstack/react-router";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { PageHeader } from "@/components/safeher/page-header";
import { GlassCard } from "@/components/safeher/glass-card";
import { Flame, Quote } from "lucide-react";

export const Route = createFileRoute("/app/inspire")({
  head: () => ({ meta: [{ title: "Daily Inspiration — SafeHer AI" }] }),
  component: Inspire,
});
function Inspire() {
  return (
    <ScreenShell>
      <PageHeader title="Daily Inspiration" subtitle="Fuel your fire" right={<div className="flex items-center gap-1 rounded-full glass px-3 py-1 text-xs font-bold"><Flame className="h-3.5 w-3.5 text-accent" />12 day streak</div>} />
      <GlassCard className="relative mb-4 overflow-hidden">
        <Quote className="absolute right-4 top-4 h-16 w-16 text-primary/10" />
        <div className="text-xs uppercase text-muted-foreground">Quote of the day</div>
        <p className="mt-2 font-display text-xl font-bold leading-snug">“The most common way people give up their power is by thinking they don't have any.”</p>
        <div className="mt-3 text-sm text-muted-foreground">— Alice Walker</div>
      </GlassCard>
      <h2 className="mb-2 text-sm font-bold">Powerful women stories</h2>
      <div className="mb-4 grid grid-cols-2 gap-3">
        {["Kalpana Chawla", "Malala Yousafzai", "Mary Kom", "Priyanka Chopra"].map((n) => (
          <GlassCard key={n} className="p-4">
            <div className="h-20 rounded-2xl gradient-brand opacity-80" />
            <div className="mt-2 text-sm font-semibold">{n}</div>
            <div className="text-xs text-muted-foreground">3 min read</div>
          </GlassCard>
        ))}
      </div>
      <GlassCard>
        <div className="text-xs uppercase text-muted-foreground">Today's affirmation</div>
        <div className="mt-1 font-semibold">I trust my instincts. I protect my peace.</div>
      </GlassCard>
    </ScreenShell>
  );
}