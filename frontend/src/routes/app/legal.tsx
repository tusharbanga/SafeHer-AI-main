import { createFileRoute } from "@tanstack/react-router";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { PageHeader } from "@/components/safeher/page-header";
import { GlassCard } from "@/components/safeher/glass-card";
import { Scale, ShieldAlert, Laptop, Home, Building2, MapPin } from "lucide-react";

export const Route = createFileRoute("/app/legal")({
  head: () => ({ meta: [{ title: "Legal Rights & Helplines — SafeHer AI" }] }),
  component: Legal,
});
const topics = [
  {
    icon: ShieldAlert,
    t: "Sexual Harassment",
    d: "IPC Sections 354, 354A & 354D • Assault, harassment & stalking",
  },
  {
    icon: Laptop,
    t: "Cyber Safety",
    d: "IT Act 2000 • Online abuse, cyberstalking & digital safety",
  },
  {
    icon: Home,
    t: "Domestic Violence",
    d: "Protection of Women from Domestic Violence Act, 2005",
  },
  {
    icon: Building2,
    t: "Workplace Rights",
    d: "POSH Act, 2013 • Protection from workplace harassment",
  },
];
function Legal() {
  return (
    <ScreenShell>
      <PageHeader title="Legal Rights" subtitle="Know. Act. Protect." />
      <div className="mb-4 grid grid-cols-2 gap-3">
        {topics.map((t) => (
          <GlassCard key={t.t} className="p-4">
            <div className="mb-2 grid h-10 w-10 place-items-center rounded-2xl gradient-brand text-white"><t.icon className="h-5 w-5" /></div>
            <div className="text-sm font-semibold">{t.t}</div>
            <div className="text-xs text-muted-foreground">{t.d}</div>
          </GlassCard>
        ))}
      </div>
      <GlassCard>
        <div className="flex items-start gap-4">
          <Scale className="mt-1 h-8 w-8 text-primary" />

          <div className="flex-1">
            <h3 className="text-lg font-semibold">Women's Legal Support</h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              If you experience harassment, domestic violence, cyber abuse,
              stalking, workplace harassment, or any threat to your safety,
              you have the legal right to seek protection and file a complaint.
            </p>

            <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <div>📞 Women Helpline: <strong>181</strong></div>
              <div>🚓 Emergency Police: <strong>112</strong></div>
              <div>💻 Cyber Crime Helpline: <strong>1930</strong></div>
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Contact your nearest District Legal Services Authority (DLSA) or One Stop Centre for free legal assistance.
            </div>
          </div>
        </div>
      </GlassCard>
    </ScreenShell>
  );
}