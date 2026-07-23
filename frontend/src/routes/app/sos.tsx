import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert, Phone, MapPin, Wifi, Hand } from "lucide-react";
import { useEffect, useState } from "react";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { PageHeader } from "@/components/safeher/page-header";
import { GlassCard } from "@/components/safeher/glass-card";

export const Route = createFileRoute("/app/sos")({
  head: () => ({ meta: [{ title: "Emergency SOS — SafeHer AI" }] }),
  component: SOS,
});

interface Contact {
  _id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  sosMessage?: string;
}

const getToken = () => {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("accessToken");
  }
  return null;
};

const apiCall = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api/v1${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
};

function SOS() {
  const [latitude, setLatitude] = useState("--");
  const [longitude, setLongitude] = useState("--");
  const [address, setAddress] = useState("Fetching location...");
  const [isOnline, setIsOnline] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  const handleEmergencyCall = () => {
    window.location.href = "tel:112";
  };

  const handleContactCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const data = await apiCall("/contacts");
      setContacts(data.data?.contacts || data.contacts || []);
    } catch (err) {
      console.error("Failed to load contacts:", err);
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined") {
      setLatitude("--");
      setLongitude("--");
      setAddress("Location unavailable");
      return;
    }

    if (!("geolocation" in navigator)) {
      setLatitude("--");
      setLongitude("--");
      setAddress("Location unavailable");
      return;
    }

    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude.toFixed(4);
          const lon = position.coords.longitude.toFixed(4);
          setLatitude(lat);
          setLongitude(lon);

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
              { headers: { Accept: "application/json" } },
            );
            const data = await response.json();
            const addressData = data?.address || {};
            const road = addressData.road || "";
            const city = addressData.city || addressData.town || "";
            const state = addressData.state || "";
            const postal = addressData.postcode || "";

            if (road && city && state && postal) {
              setAddress(`${road}, ${city} ${postal}`);
            } else if (road && city && postal) {
              setAddress(`${road}, ${city} ${postal}`);
            } else if (city && state && postal) {
              setAddress(`${city}, ${state} ${postal}`);
            } else {
              setAddress("Location available");
            }
          } catch {
            setAddress("Location available");
          }
        },
        () => {
          setLatitude("--");
          setLongitude("--");
          setAddress("Location unavailable");
        },
      );
    };

    updateLocation();
    const interval = setInterval(updateLocation, 1000);

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
      <PageHeader title="Emergency SOS" subtitle="Press & hold · Double tap · Shake" />
      <div className="my-8 flex flex-col items-center">
        <div className="relative grid h-56 w-56 place-items-center">
          <span className="absolute inset-0 rounded-full border-2 border-accent/40 animate-pulse-ring" />
          <span className="absolute inset-4 rounded-full border-2 border-primary/40 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
          <button onClick={handleEmergencyCall} className="relative grid h-40 w-40 place-items-center rounded-full text-white shadow-glow active:scale-95 transition-transform"
                  style={{ background: "linear-gradient(135deg, oklch(0.62 0.25 25), oklch(0.7 0.22 355))" }}>
            <ShieldAlert className="h-14 w-14" />
            <span className="mt-1 text-lg font-extrabold tracking-widest">SOS</span>
          </button>
        </div>
        {/* <p className="mt-6 text-sm text-muted-foreground"><span className="font-bold text-foreground"></span></p> */}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Chip icon={Phone} label="Police" value="112" />
        <Chip icon={Phone} label="Women Helpline" value="1091" />
        <Chip icon={MapPin} label="Latitude" value={`${latitude}°`} />
        <Chip icon={MapPin} label="Longitude" value={`${longitude}°`} />
        <Chip icon={Wifi} label="Internet" value={isOnline ? "Online" : "Offline"} />
        <Chip icon={Hand} label="Status" value="Ready" />
      </div>

      <GlassCard className="mt-5">
        <div className="text-xs text-muted-foreground">Current Address</div>
        <div className="mt-1 font-semibold">{address}</div>
      </GlassCard>

      <GlassCard className="mt-3">
        <div className="text-xs text-muted-foreground">Emergency Contacts</div>
        <ul className="mt-2 space-y-2 text-sm">
          {loadingContacts ? (
            <li className="text-muted-foreground">Loading contacts...</li>
          ) : contacts.length > 0 ? (
            contacts.map((c) => (
              <li key={c._id} className="flex items-center justify-between group">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.relationship}</div>
                </div>
                <button
                  onClick={() => handleContactCall(c.phone)}
                  className="text-primary hover:text-primary/80 transition-colors"
                  title={c.phone}
                >
                  <Phone className="h-4 w-4" />
                </button>
              </li>
            ))
          ) : (
            <li className="text-muted-foreground text-xs">No contacts added yet. Go to Emergency Contacts to add.</li>
          )}
        </ul>
      </GlassCard>
    </ScreenShell>
  );
}

function Chip({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-3 shadow-soft">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 text-sm font-bold">{value}</div>
    </div>
  );
}