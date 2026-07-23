import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { PageHeader } from "@/components/safeher/page-header";
import { GlassCard } from "@/components/safeher/glass-card";
import { Moon, Fingerprint, Mic, Languages, Shield, Wifi, Cloud, BatteryCharging, LogOut } from "lucide-react";
import { useState } from "react";
import { authApi, clearAuthSession } from "@/lib/api";
import { firebaseSignOut } from "@/lib/auth";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — SafeHer AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const items = [
    { icon: Moon, label: "Dark Mode" },
    { icon: Fingerprint, label: "Biometric Lock" },
    { icon: Mic, label: "Voice Code" },
    { icon: Languages, label: "Language" },
    { icon: Shield, label: "Permissions" },
    { icon: Wifi, label: "Offline Mode" },
    { icon: Cloud, label: "Cloud Backup" },
    { icon: BatteryCharging, label: "Battery Optimization" },
  ];
  const [on, setOn] = useState<Record<string, boolean>>({ "Dark Mode": false, "Biometric Lock": true, "Voice Code": true, "Cloud Backup": true });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
      await firebaseSignOut();
    } catch {
      // Logout is stateless server-side (JWT); clear the local session regardless.
      await firebaseSignOut();
    } finally {
      clearAuthSession();
      navigate({ to: "/login" });
    }
  };

  return (
    <ScreenShell>
      <PageHeader title="Settings" subtitle="Fine-tune SafeHer AI" />
      <GlassCard className="divide-y divide-border p-0">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-white"><it.icon className="h-4 w-4" /></div>
            <div className="flex-1 text-sm font-semibold">{it.label}</div>
            <Toggle on={!!on[it.label]} onChange={(v) => setOn((s) => ({ ...s, [it.label]: v }))} />
          </div>
        ))}
      </GlassCard>
      <GlassCard className="mt-4 p-0">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 p-4 text-left disabled:opacity-60"
        >
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-brand text-white"><LogOut className="h-4 w-4" /></div>
          <div className="flex-1 text-sm font-semibold">{isLoggingOut ? "Logging out..." : "Log Out"}</div>
        </button>
      </GlassCard>
    </ScreenShell>
  );
}
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className={`relative h-6 w-11 rounded-full transition-colors ${on ? "gradient-brand shadow-glow" : "bg-muted"}`} aria-pressed={on}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-5" : "left-0.5"}`} />
    </button>
  );
}