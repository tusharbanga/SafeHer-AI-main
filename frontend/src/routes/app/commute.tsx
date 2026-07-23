import { createFileRoute } from "@tanstack/react-router";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { PageHeader } from "@/components/safeher/page-header";
import { GlassCard } from "@/components/safeher/glass-card";
import { GradientButton } from "@/components/safeher/gradient-button";
import { Building2, Home, Clock, Car, Battery, Wifi } from "lucide-react";

export const Route = createFileRoute("/app/commute")({
  head: () => ({ meta: [{ title: "Commute Guardian — SafeHer AI" }] }),
  component: Commute,
});
function Commute() {
  return (
    <ScreenShell>
      <PageHeader title="Commute Guardian" subtitle="Office → Home, safely" />
      <GlassCard className="mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />Office</div>
          <div className="mx-3 flex-1 border-b border-dashed border-border" />
          <div className="flex items-center gap-2"><Home className="h-4 w-4 text-accent" />Home</div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat icon={Clock} k="ETA" v="7:42 PM" />
          <Stat icon={Car} k="Cab" v="On route" />
          <Stat icon={Battery} k="Battery" v="82%" />
          <Stat icon={Wifi} k="Internet" v="Strong" />
        </div>
      </GlassCard>
      <GradientButton className="w-full">Start Journey</GradientButton>
      <GlassCard className="mt-4 border-l-4 border-accent bg-accent/5">
        <div className="text-sm font-semibold">AI check-in</div>
        <div className="mt-1 text-xs text-muted-foreground">If you don't reach home by 8:10 PM, SafeHer will ask “Are you safe?” and notify your emergency contacts if you don't respond.</div>
      </GlassCard>
    </ScreenShell>
  );
}
function Stat({ icon: Icon, k, v }: { icon: typeof Clock; k: string; v: string }) {
  return <div className="rounded-2xl bg-muted/40 p-3"><div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground"><Icon className="h-3.5 w-3.5" />{k}</div><div className="mt-1 font-bold">{v}</div></div>;
}