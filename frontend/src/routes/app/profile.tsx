import { createFileRoute, Link } from "@tanstack/react-router";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { GlassCard } from "@/components/safeher/glass-card";
import { ThemeToggle } from "@/components/safeher/theme-toggle";
import { Droplet, Heart, Users, Languages, Bell, Lock, ShieldCheck, Settings } from "lucide-react";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "Profile — SafeHer AI" }] }),
  component: Profile,
});
function Profile() {
  return (
    <ScreenShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <div className="flex gap-2">
          <ThemeToggle />
          <Link to="/app/settings" className="grid h-10 w-10 place-items-center rounded-full glass shadow-soft"><Settings className="h-5 w-5" /></Link>
        </div>
      </div>
      <GlassCard className="mb-4 flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full gradient-brand text-2xl font-bold text-white shadow-glow">T</div>
        <div className="flex-1">
          <div className="text-lg font-bold">Tanishttha Sharma</div>
          <div className="text-xs text-muted-foreground">tanishttha@safeher.ai</div>
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"><ShieldCheck className="h-3 w-3" />Guardian ACTIVE</div>
        </div>
      </GlassCard>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Info icon={Droplet} k="Blood Group" v="O+" />
        <Info icon={Heart} k="Allergies" v="Peanuts" />
        <Info icon={Users} k="Contacts" v="4 trusted" />
        <Info icon={Languages} k="Language" v="English" />
      </div>
      <h2 className="mb-2 text-sm font-bold">Preferences</h2>
      <GlassCard className="divide-y divide-border p-0">
        <Row icon={Bell} label="Notifications" v="On" />
        <Row icon={Lock} label="Privacy" v="Strict" />
        <Row icon={ShieldCheck} label="Guardian Mode" v="Auto" />
      </GlassCard>
    </ScreenShell>
  );
}
function Info({ icon: Icon, k, v }: { icon: typeof Droplet; k: string; v: string }) {
  return (
    <div className="glass rounded-2xl p-3 shadow-soft">
      <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground"><Icon className="h-3.5 w-3.5" />{k}</div>
      <div className="mt-1 font-bold">{v}</div>
    </div>
  );
}
function Row({ icon: Icon, label, v }: { icon: typeof Bell; label: string; v: string }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <Icon className="h-4 w-4 text-primary" />
      <div className="flex-1 text-sm font-semibold">{label}</div>
      <div className="text-xs text-muted-foreground">{v}</div>
    </div>
  );
}