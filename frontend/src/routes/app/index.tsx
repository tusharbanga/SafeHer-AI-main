import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ShieldCheck, MapPin, Bot, Car, Phone as PhoneIcon, HeartHandshake, Mic, Sparkles,
  BookOpen, Users, Volume2, Lock, Wifi, LogOut,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/safeher/brand";
import { GlassCard } from "@/components/safeher/glass-card";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { ThemeToggle } from "@/components/safeher/theme-toggle";

import { clearAuthSession } from "@/lib/api";
import { firebaseSignOut } from "@/lib/auth";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — SafeHer AI" }] }),
  component: Dashboard,
});

const quick = [
  { to: "/app/sos", label: "Emergency SOS", icon: ShieldCheck, tone: "from-rose-500 to-pink-500" },
  { to: "/app/saferoute", label: "Safe Route", icon: MapPin, tone: "from-violet-500 to-fuchsia-500" },
  { to: "/app/tracking", label: "Live Tracking", icon: MapPin, tone: "from-indigo-500 to-purple-500" },
  { to: "/app/contacts", label: "Contacts", icon: PhoneIcon, tone: "from-pink-500 to-rose-400" },
  { to: "/app/ride", label: "Ride Guardian", icon: Car, tone: "from-purple-500 to-pink-500" },
  { to: "/app/assistant", label: "AI Assistant", icon: Bot, tone: "from-indigo-500 to-blue-500" },
  { to: "/app/defence", label: "Self Defence", icon: HeartHandshake, tone: "from-rose-500 to-orange-400" },
  { to: "/app/legal", label: "Helpline & Law", icon: BookOpen, tone: "from-violet-500 to-indigo-500" },
  { to: "/app/fakecall", label: "Fake Call", icon: Volume2, tone: "from-purple-500 to-fuchsia-500" },
] as const;

function Dashboard() {
  const [guardian, setGuardian] = useState(true);
  const [userName, setUserName] = useState("User");
  const [locationLabel, setLocationLabel] = useState("Location unavailable");
  const [isOnline, setIsOnline] = useState(true);
  const [latitude, setLatitude] = useState("--");
  const [longitude, setLongitude] = useState("--");

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await firebaseSignOut();
    } catch {}

    clearAuthSession();

    navigate({ to: "/login" });
  };

  const emergencyContactsAdded = true;
  const liveLocationActive = latitude !== "--" && longitude !== "--";
  const voiceGuardianActive = guardian;
  const safeRouteReady = liveLocationActive;
  const networkAvailable = isOnline;

  const safetyScore =
    (emergencyContactsAdded ? 25 : 0) +
    (liveLocationActive ? 25 : 0) +
    (voiceGuardianActive ? 20 : 0) +
    (safeRouteReady ? 15 : 0) +
    (networkAvailable ? 15 : 0);

  const safetyStatus =
    safetyScore >= 85
      ? "Protected"
      : safetyScore >= 60
        ? "Stay Alert"
        : safetyScore >= 40
          ? "Potential Risk"
          : "High Risk";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = window.localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser?.name) {
            setUserName(parsedUser.name);
          }
        } catch {
          setUserName("User");
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined") {
      setLocationLabel("Location unavailable");
      return;
    }

    if (!("geolocation" in navigator)) {
      setLocationLabel("Location unavailable");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`,
            { headers: { Accept: "application/json" } },
          );
          const data = await response.json();
          const address = data?.address || {};
          const city = address.city || address.town || address.village || address.suburb || address.hamlet || "";
          const state = address.state || address.state_district || "";

          if (city && state) {
            setLocationLabel(`${city}, ${state}`);
          } else if (city) {
            setLocationLabel(city);
          } else if (state) {
            setLocationLabel(state);
          } else {
            setLocationLabel("Location unavailable");
          }
        } catch {
          setLocationLabel("Location unavailable");
        }
      },
      () => {
        setLocationLabel("Location unavailable");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 },
    );
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined") {
      setLatitude("--");
      setLongitude("--");
      return;
    }

    if (!("geolocation" in navigator)) {
      setLatitude("--");
      setLongitude("--");
      return;
    }

    const updateCoordinates = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(4);
          const lon = position.coords.longitude.toFixed(4);
          setLatitude(lat);
          setLongitude(lon);
        },
        () => {
          setLatitude("--");
          setLongitude("--");
        },
      );
    };

    updateCoordinates();
    const interval = setInterval(updateCoordinates, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined") {
      setIsOnline(true);
      return;
    }

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  return (
    <ScreenShell>
      <div className="mb-5 flex items-center justify-between">
        <BrandLogo />
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card hover:bg-muted transition-colors"
          >
            <LogOut className="h-5 w-5 text-rose-500" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground">Good Evening,</p>
        <h1 className="text-3xl font-bold tracking-tight">{userName} ✨</h1>
      </div>

      <GlassCard className="mb-4 flex items-center justify-between p-4">
        <div>
          <div className="text-xs text-muted-foreground">AI Safety Index</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="gradient-brand-text text-3xl font-extrabold">{safetyScore}</span>
            <span className="text-xs font-semibold" style={{ color: "var(--color-safe)" }}>{safetyStatus}</span>
          </div>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <div>{emergencyContactsAdded ? "✓" : "○"} Emergency Contacts</div>
            <div>{liveLocationActive ? "✓" : "○"} Live Location Active</div>
            <div>{voiceGuardianActive ? "✓" : "○"} Voice Guardian</div>
            <div>{networkAvailable ? "✓" : "○"} Network Connected</div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs">
          <Info icon={Wifi} label={isOnline ? "Online" : "Offline"} />
          <Info icon={MapPin} label={locationLabel} />
          <Info icon={MapPin} label={`${latitude}°, ${longitude}°`} />
        </div>
      </GlassCard>

{/* 
<GlassCard className="mb-5 overflow-hidden p-0">
  ...
</GlassCard>
*/}

      <Link to="/app/voice" className="block">
        <GlassCard className="mb-5 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-accent">
            <Mic className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">Voice Guardian</div>
            <div className="truncate text-xs text-muted-foreground">Secret word: “Sunshine” · Listening</div>
          </div>
          <Waveform />
        </GlassCard>
      </Link>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Quick Actions</h2>
        <Link to="/app/inspire" className="text-xs font-semibold text-primary">Daily Inspiration →</Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {quick.map((q) => (
          <Link key={q.to} to={q.to} className="group">
            <div className="rounded-2xl glass p-3 shadow-soft transition-transform group-active:scale-95">
              <div className={`mb-2 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${q.tone} text-white shadow-glow`}>
                <q.icon className="h-5 w-5" />
              </div>
              <div className="text-[11px] font-semibold leading-tight">{q.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <GlassCard className="mt-5 flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-glow">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-muted-foreground">Affirmation</div>
          <div className="text-sm font-medium">“I am safe. I am strong. I am supported.”</div>
        </div>
      </GlassCard>

      <Link to="/app/sos" className="fixed bottom-24 right-5 z-30 grid h-16 w-16 place-items-center rounded-full gradient-brand text-white shadow-glow active:scale-95">
        <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-pulse-ring" />
        <span className="text-xs font-bold">SOS</span>
      </Link>
    </ScreenShell>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${on ? "gradient-brand shadow-glow" : "bg-muted"}`}
      aria-pressed={on}
    >
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-7" : "left-1"}`} />
    </button>
  );
}

function Info({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <Icon className="h-3.5 w-3.5" /> <span className="truncate">{label}</span>
    </div>
  );
}

function Waveform() {
  return (
    <div className="flex items-end gap-0.5">
      {[6, 12, 18, 10, 22, 14, 8].map((h, i) => (
        <span key={i} className="w-1 rounded-full gradient-brand" style={{ height: h, animation: `float-slow 1.${i}s ease-in-out infinite alternate` }} />
      ))}
    </div>
  );
}