import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { PageHeader } from "@/components/safeher/page-header";
import { GlassCard } from "@/components/safeher/glass-card";
import { GradientButton } from "@/components/safeher/gradient-button";
import { locationApi } from "@/lib/api";
import { getUserSocket, disconnectUserSocket } from "@/lib/socket";
import {
  Clock3,
  MapPin,
  Users,
  Wifi,
  type LucideIcon,
} from "lucide-react";

type LocationData = {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
};

type LocationError = {
  title: string;
  message: string;
};

const DEFAULT_CENTER: L.LatLngExpression = [20.5937, 78.9629];

function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { _id?: string; id?: string; uid?: string };
    return parsed._id ?? parsed.id ?? parsed.uid ?? null;
  } catch {
    return null;
  }
}

const locationIcon = L.divIcon({
  className: "safeher-location-marker",
  html: '<span class="safeher-location-pulse"></span><span class="safeher-location-dot"><span></span></span>',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

export const Route = createFileRoute("/app/tracking")({
  head: () => ({
    meta: [{ title: "Live Tracking — SafeHer AI" }],
  }),
  component: Tracking,
});

function Tracking() {
  const [location, setLocation] = useState<LocationData | null>(null );
  const [watching, setWatching] = useState(false);
  const [locationError, setLocationError] = useState<LocationError | null>(null);
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );
  const [contacts, setContacts] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [sharingError, setSharingError] = useState<string | null>(null);
  const lastEmitRef = useRef(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError({
        title: "GPS not supported",
        message: "This browser does not support location sharing.",
      });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { coords, timestamp } = position;

        const next: LocationData = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: Math.round(coords.accuracy),
          speed: coords.speed === null ? null : Math.max(0, coords.speed * 3.6),
          heading: coords.heading,
          timestamp,
        };

        setLocation(next);
        setLocationError(null);
        setWatching(true);

        if (isSharing) {
          const now = Date.now();
          if (now - lastEmitRef.current >= 1000) {
            lastEmitRef.current = now;
            const userId = getStoredUserId();
            const socket = getUserSocket();
            if (socket && userId) {
              socket.emit("location:update", {
                userId,
                latitude: next.latitude,
                longitude: next.longitude,
                accuracy: next.accuracy,
                timestamp: next.timestamp,
              });
            } else {
              // Socket unavailable — fall back to the REST endpoint.
              locationApi.update(next.latitude, next.longitude, next.accuracy).catch(() => undefined);
            }
          }
        }
      },
      (error) => {
        setWatching(false);
        setLocationError(getLocationError(error));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 1000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isSharing]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const response = await fetch(`${import.meta.env.VITE_API_URL}/v1/contacts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();
        setContacts(result?.data?.contacts?.map((c: any) => c.name) ?? []);
      } catch (error) {
        console.error("Failed to load emergency contacts", error);
        setContacts([]);
      }
    };

    fetchContacts();
  }, []);

  const handleStartSharing = async () => {
    setSharingError(null);
    try {
      await locationApi.start(
        location
          ? { latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy }
          : undefined,
      );
      setIsSharing(true);
    } catch (error) {
      setSharingError(error instanceof Error ? error.message : "Could not start live sharing.");
    }
  };

  const handleStopSharing = async () => {
    setSharingError(null);
    try {
      const userId = getStoredUserId();
      const socket = getUserSocket();
      if (socket && userId) {
        socket.emit("location:stop", { userId });
      }
      await locationApi.stop();
    } catch (error) {
      setSharingError(error instanceof Error ? error.message : "Could not stop live sharing.");
    } finally {
      setIsSharing(false);
      disconnectUserSocket();
    }
  };

  useEffect(() => {
    return () => {
      if (isSharing) disconnectUserSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mapCenter = useMemo<L.LatLngExpression>(
    () => (location ? [location.latitude, location.longitude] : DEFAULT_CENTER),
    [location],
  );

  const sharingValue = contacts.length > 0 ? contacts.join(", ") : "No Emergency Contacts";

  return (
    <ScreenShell>
      <style>{locationMarkerStyles}</style>

      <PageHeader
        title="Live Tracking"
        subtitle={
          watching
            ? "Your location is being shared live"
            : locationError
              ? "Location sharing needs your attention"
              : "Waiting for GPS..."
        }
      />

      <GlassCard className="relative mb-5 h-64 overflow-hidden p-0">
        <MapContainer
          center={mapCenter}
          zoom={17}
          zoomControl={false}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {location && (
            <>
              <MapFollower latitude={location.latitude} longitude={location.longitude} />
              <Marker
                position={[location.latitude, location.longitude]}
                icon={locationIcon}
                zIndexOffset={1000}
              />
            </>
          )}
        </MapContainer>

        <div className="pointer-events-none absolute right-3 top-3 z-[500] rounded-full border border-white/20 bg-slate-950/75 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-xl">
          {isSharing ? "🟢 Sharing Active" : "⚪ Not Sharing"}
        </div>

        {!location && !locationError && <LoadingLocation />}
        {locationError && <LocationErrorCard error={locationError} />}

        {location && (
          <div className="absolute bottom-3 left-3 right-3 z-[500] glass rounded-2xl p-3 backdrop-blur-xl">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
              <MapPin className="h-4 w-4 text-primary" />
              Current location
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span>
                Lat <strong className="ml-1 text-white">{location.latitude.toFixed(6)}</strong>
              </span>
              <span>
                Long <strong className="ml-1 text-white">{location.longitude.toFixed(6)}</strong>
              </span>
            </div>
          </div>
        )}
      </GlassCard>

      {sharingError && (
        <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-500">
          {sharingError}
        </div>
      )}

      <GlassCard className="mb-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold">{isSharing ? "Sharing Active 🟢" : "Live Sharing"}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {isSharing
                ? `Your guardians can see this in real time. Last update ${
                    location ? formatTimestamp(location.timestamp) : "—"
                  }.`
                : "Start sharing so your emergency contacts can see your live location."}
            </p>
          </div>
          <GradientButton
            variant={isSharing ? "outline" : "solid"}
            className="shrink-0"
            disabled={!location && !isSharing}
            onClick={() => (isSharing ? handleStopSharing() : handleStartSharing())}
          >
            {isSharing ? "Stop Sharing" : "Start Live Sharing"}
          </GradientButton>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={Wifi} k="Internet" v={isOnline ? "Connected" : "Offline"} />
        <Stat icon={Users} k="Sharing" v={sharingValue} />
      </div>

      <h2 className="mb-3 mt-6 text-sm font-bold">Live Updates</h2>

      <GlassCard>
        <ol className="space-y-4 text-sm">
          <TimelineItem
            color="bg-green-500"
            label="GPS Started"
            value={watching ? "Live location sharing is active." : "Connecting to your device GPS..."}
            pulse={watching}
          />
          <TimelineItem
            color="bg-blue-500"
            label="Current Coordinates"
            value={location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : "Waiting for your first location"}
          />
          <TimelineItem
            color={isSharing ? "bg-emerald-500" : "bg-slate-400"}
            label="Guardian Sharing"
            value={isSharing ? "Live updates are being sent to your guardians." : "Sharing is currently stopped."}
            pulse={isSharing}
          />
        </ol>
      </GlassCard>
    </ScreenShell>

  );
}

function MapFollower({ latitude, longitude }: Pick<LocationData, "latitude" | "longitude">) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([latitude, longitude], 17, { animate: true, duration: 0.8 });
  }, [latitude, longitude, map]);

  return null;
}

function LoadingLocation() {
  return (
    <div className="absolute inset-0 z-[500] flex items-center justify-center bg-slate-950/35 backdrop-blur-[1px]">
      <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-primary" />
        Acquiring GPS signal...
      </div>
    </div>
  );
}

function LocationErrorCard({ error }: { error: LocationError }) {
  return (
    <div className="absolute inset-0 z-[500] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[1px]">
      <div className="glass max-w-sm rounded-2xl border border-red-400/25 p-4 shadow-xl">
        <div className="mb-1 font-semibold text-red-300">{error.title}</div>
        <p className="text-xs leading-5 text-muted-foreground">{error.message}</p>
      </div>
    </div>
  );
}

function TimelineItem({
  color,
  label,
  value,
  pulse = false,
}: {
  color: string;
  label: string;
  value: string;
  pulse?: boolean;
}) {
  return (
    <li className="flex gap-3">
      <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${color} ${pulse ? "animate-pulse" : ""}`} />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div>{value}</div>
      </div>
    </li>
  );
}

function Stat({ icon: Icon, k, v }: { icon: LucideIcon; k: string; v: string }) {
  return (
    <div className="glass rounded-2xl p-4 shadow-soft">
      <div className="flex items-center gap-2 text-[10px] uppercase text-muted-foreground">
        <Icon className="h-4 w-4" />
        {k}
      </div>
      <div className="mt-2 text-lg font-bold">{v}</div>
    </div>
  );
}

function getLocationError(error: GeolocationPositionError): LocationError {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return { title: "Location permission denied", message: "Allow location access in your browser settings to start live tracking." };
    case error.POSITION_UNAVAILABLE:
      return { title: "Location unavailable", message: "Your device cannot determine a location right now. Check your signal and try again." };
    case error.TIMEOUT:
      return { title: "GPS timed out", message: "We could not get a location within 10 seconds. Move somewhere with a clearer view of the sky." };
    default:
      return { title: "GPS connection issue", message: "Live location could not be started. Please try again." };
  }
}

function formatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));
}

const locationMarkerStyles = `
  .safeher-location-marker { background: transparent; border: 0; }
  .safeher-location-pulse { position: absolute; inset: 2px; border-radius: 9999px; background: rgba(59, 130, 246, .34); animation: safeher-location-pulse 1.8s ease-out infinite; }
  .safeher-location-dot { position: absolute; inset: 10px; display: grid; place-items: center; border: 3px solid white; border-radius: 9999px; background: #2563eb; box-shadow: 0 0 0 5px rgba(37, 99, 235, .25), 0 6px 18px rgba(37, 99, 235, .7); animation: safeher-location-bob .8s ease-in-out infinite alternate; }
  .safeher-location-dot span { width: 5px; height: 5px; border-radius: 9999px; background: white; }
  @keyframes safeher-location-pulse { 0% { transform: scale(.55); opacity: .9; } 100% { transform: scale(1.25); opacity: 0; } }
  @keyframes safeher-location-bob { from { transform: translateY(0); } to { transform: translateY(-2px); } }
`;
