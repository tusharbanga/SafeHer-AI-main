import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Phone, ShieldAlert, Users, Clock3 } from "lucide-react";
import { GlassCard } from "@/components/safeher/glass-card";
import { GradientButton } from "@/components/safeher/gradient-button";
import { PageHeader } from "@/components/safeher/page-header";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { LocationMap } from "@/components/safeher/location-map";
import {
  guardianApi,
  clearGuardianSession,
  isGuardianAuthenticated,
  type GuardianDashboardResponse,
} from "@/lib/guardianApi";
import { getGuardianSocket, disconnectGuardianSocket } from "@/lib/socket";

type DashboardData = GuardianDashboardResponse["data"];

export const Route = createFileRoute("/guardian/dashboard")({
  head: () => ({ meta: [{ title: "Guardian Dashboard — SafeHer AI" }] }),
  component: GuardianDashboard,
});

function GuardianDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emergency, setEmergency] = useState<{ googleMapsLink?: string } | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isGuardianAuthenticated()) {
      navigate({ to: "/guardian/login" });
    }
  }, [navigate]);

  const loadDashboard = async (userId?: string) => {
    try {
      const response = await guardianApi.dashboard(userId);
      setData(response.data);
      setSelectedUserId(response.data.connectedUser.id);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load guardian dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  // Fallback polling every 10s in case the socket connection drops.
  useEffect(() => {
    pollRef.current = window.setInterval(() => {
      if (selectedUserId) void loadDashboard(selectedUserId);
    }, 10000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [selectedUserId]);

  // Real-time updates via Socket.io
  useEffect(() => {
    if (!selectedUserId) return;

    const socket = getGuardianSocket();
    if (!socket) return;

    socket.emit("guardian:watch", { userId: selectedUserId });

    const handleLocationUpdate = (payload: {
      userId: string;
      latitude: number;
      longitude: number;
      accuracy: number;
      updatedAt: string;
    }) => {
      if (payload.userId !== selectedUserId) return;
      setData((prev) =>
        prev
          ? {
              ...prev,
              location: {
                latitude: payload.latitude,
                longitude: payload.longitude,
                accuracy: payload.accuracy,
                isSharing: true,
                updatedAt: payload.updatedAt,
              },
            }
          : prev
      );
    };

    const handleStopped = (payload: { userId: string }) => {
      if (payload.userId !== selectedUserId) return;
      setData((prev) => (prev ? { ...prev, location: null } : prev));
    };

    const handleEmergency = (payload: { googleMapsLink?: string }) => {
      setEmergency(payload);
      setData((prev) => (prev ? { ...prev, safetyStatus: "sos" } : prev));
    };

    socket.on("location:update", handleLocationUpdate);
    socket.on("location:stopped", handleStopped);
    socket.on("emergency:alert", handleEmergency);

    return () => {
      socket.emit("guardian:unwatch", { userId: selectedUserId });
      socket.off("location:update", handleLocationUpdate);
      socket.off("location:stopped", handleStopped);
      socket.off("emergency:alert", handleEmergency);
    };
  }, [selectedUserId]);

  useEffect(() => {
    return () => disconnectGuardianSocket();
  }, []);

  const lastUpdatedLabel = useMemo(() => {
    if (!data?.location?.updatedAt) return "No location shared yet";
    const seconds = Math.max(0, Math.round((Date.now() - new Date(data.location.updatedAt).getTime()) / 1000));
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    return `${minutes} min ago`;
  }, [data?.location?.updatedAt]);

  const handleLogout = () => {
    clearGuardianSession();
    disconnectGuardianSocket();
    navigate({ to: "/guardian/login" });
  };

  if (isLoading) {
    return (
      <ScreenShell>
        <PageHeader title="Guardian Dashboard" subtitle="Loading..." back={false} />
        <GlassCard className="grid h-64 place-items-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-primary" />
        </GlassCard>
      </ScreenShell>
    );
  }

  if (error || !data) {
    return (
      <ScreenShell>
        <PageHeader title="Guardian Dashboard" back={false} />
        <GlassCard>
          <p className="text-sm text-rose-500">{error ?? "Could not load your guardian dashboard."}</p>
          <GradientButton className="mt-4" onClick={() => navigate({ to: "/guardian/login" })}>
            Back to login
          </GradientButton>
        </GlassCard>
      </ScreenShell>
    );
  }

  const isSos = data.safetyStatus === "sos";

  return (
    <ScreenShell>
      <PageHeader
        title="Guardian Mode"
        subtitle={`Watching ${data.connectedUser.name}`}
        back={false}
        right={
          <button onClick={handleLogout} className="rounded-full glass px-3 py-1.5 text-xs font-semibold shadow-soft">
            Log out
          </button>
        }
      />

      {emergency && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
          <ShieldAlert className="h-6 w-6 shrink-0 text-rose-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-rose-500">🚨 Emergency alert — {data.connectedUser.name} needs help</p>
            {emergency.googleMapsLink && (
              <a
                href={emergency.googleMapsLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold underline text-rose-500"
              >
                Open location in Maps
              </a>
            )}
          </div>
        </div>
      )}

      {data.linkedUsers.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {data.linkedUsers.map((linked) => (
            <button
              key={linked.userId}
              onClick={() => void loadDashboard(linked.userId)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                linked.userId === selectedUserId ? "gradient-brand text-white shadow-glow" : "glass"
              }`}
            >
              {linked.name}
            </button>
          ))}
        </div>
      )}

      <GlassCard className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full gradient-brand text-white font-bold">
            {data.connectedUser.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="font-bold">{data.connectedUser.name}</div>
            <div className="text-xs text-muted-foreground">Connected user</div>
          </div>
        </div>
        <div
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            isSos ? "bg-rose-500/15 text-rose-500" : "bg-emerald-500/15 text-emerald-500"
          }`}
        >
          {isSos ? "🔴 SOS Active" : "🟢 Safe"}
        </div>
      </GlassCard>

      <GlassCard className="relative mb-5 h-64 overflow-hidden p-0">
        <LocationMap
          latitude={data.location?.latitude ?? null}
          longitude={data.location?.longitude ?? null}
          accuracy={data.location?.accuracy}
          className="h-full w-full"
        />
        {!data.location && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-slate-950/35 backdrop-blur-[1px]">
            <div className="glass rounded-2xl px-4 py-3 text-sm font-medium shadow-lg">
              {data.connectedUser.name} isn't sharing their location right now
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute right-3 top-3 z-[500] rounded-full border border-white/20 bg-slate-950/75 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-xl">
          {data.location ? "🟢 Live Location" : "⚪ Offline"}
        </div>
      </GlassCard>
    </ScreenShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4 shadow-soft">
      <div className="flex items-center gap-2 text-[10px] uppercase text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 text-lg font-bold">{value}</div>
    </div>
  );
}
