import { createFileRoute } from "@tanstack/react-router";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { PageHeader } from "@/components/safeher/page-header";
import { GlassCard } from "@/components/safeher/glass-card";
import { Cloud, HardDrive, FileDown, Mic, Video, Image as ImageIcon } from "lucide-react";
import { GradientButton } from "@/components/safeher/gradient-button";

export const Route = createFileRoute("/app/vault")({
  head: () => ({ meta: [{ title: "Evidence Vault — SafeHer AI" }] }),
  component: Vault,
});

function Vault() {
  return (
    <ScreenShell>
      <PageHeader title="Evidence Vault" subtitle="End-to-end encrypted" />
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Status icon={Cloud} label="Cloud Sync" v="Synced" />
        <Status icon={HardDrive} label="Local Backup" v="Up to date" />
      </div>
      <div className="space-y-3">
        {[
          { t: "Audio · 2m 34s", d: "Yesterday · 9:42 PM", icon: Mic },
          { t: "Video · 45s", d: "Yesterday · 9:41 PM", icon: Video },
          { t: "Photo", d: "Yesterday · 9:40 PM", icon: ImageIcon },
        ].map((e) => (
          <GlassCard key={e.t} className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-brand text-white"><e.icon className="h-5 w-5" /></div>
            <div className="flex-1"><div className="font-semibold text-sm">{e.t}</div><div className="text-xs text-muted-foreground">{e.d}</div></div>
            <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">AES-256</span>
          </GlassCard>
        ))}
      </div>
      <GradientButton className="mt-6 w-full"><FileDown className="h-4 w-4" />Download Emergency Report</GradientButton>
    </ScreenShell>
  );
}
function Status({ icon: Icon, label, v }: { icon: typeof Cloud; label: string; v: string }) {
  return (
    <div className="glass rounded-2xl p-3 shadow-soft">
      <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div>
      <div className="mt-1 text-sm font-bold" style={{ color: "var(--color-safe)" }}>{v}</div>
    </div>
  );
}