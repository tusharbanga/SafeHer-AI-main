import { createFileRoute } from "@tanstack/react-router";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { PageHeader } from "@/components/safeher/page-header";
import { GlassCard } from "@/components/safeher/glass-card";
import { GradientButton } from "@/components/safeher/gradient-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Navigation, Save } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export const Route = createFileRoute("/app/saferoute")({
  head: () => ({ meta: [{ title: "Safe Route — SafeHer AI" }] }),
  component: SafeRoute,
});

interface LocationCoords {
  latitude: number;
  longitude: number;
  address?: string;
}

type RouteKind = "safe" | "fastest";
type TravelMode = "vehicle" | "walk";

interface RouteOption {
  kind: RouteKind;
  title: string;
  description: string;
  coordinates: [number, number][];
  distance: number;
  duration: number;
  directions: NavigationStep[];
}

interface NavigationStep {
  instruction: string;
  distance: number;
  latitude: number;
  longitude: number;
}

interface UserData {
  homeLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
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

const reverseGeocode = async (lat: number, lon: number) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      { headers: { Accept: "application/json" } }
    );
    const data = await response.json();
    const addressData = data?.address || {};
    const road = addressData.road || "";
    const city = addressData.city || addressData.town || "";
    return road && city ? `${road}, ${city}` : "Location";
  } catch {
    return "Location";
  }
};

const geoapifyApiKey = import.meta.env.VITE_GEOAPIFY_API_KEY as string | undefined;

function SafeRoute() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const routeLayers = useRef<L.Polyline[]>([]);
  const currentMarker = useRef<L.Marker | null>(null);
  const homeMarker = useRef<L.Marker | null>(null);
  const lastRouteRequest = useRef(0);
  const offRouteRef = useRef(false);

  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [homeLocation, setHomeLocation] = useState<LocationCoords | null>(null);
  const [routeOptions, setRouteOptions] = useState<Partial<Record<RouteKind, RouteOption>>>({});
  const [travelMode, setTravelMode] = useState<TravelMode>("vehicle");
  const [selectedRoute, setSelectedRoute] = useState<RouteKind>("safe");
  const [showDirections, setShowDirections] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingHome, setSavingHome] = useState(false);
  const [message, setMessage] = useState("");
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [selectedHomeLocation, setSelectedHomeLocation] = useState<LocationCoords | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current).setView([20, 77], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map.current);
  }, []);

  // Keep the user's current position fresh as the device GPS reports it.
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setMessage("Location services are not available on this device");
      return;
    }

    let hasResolvedInitialAddress = false;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setCurrentLocation((previousLocation) => ({
          latitude,
          longitude,
          address: previousLocation?.address ?? "Current location",
        }));

        if (currentMarker.current) {
          currentMarker.current.setLatLng([latitude, longitude]);
        } else if (map.current) {
          currentMarker.current = L.marker([latitude, longitude], {
            icon: L.icon({
              iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234F46E5'%3E%3Ccircle cx='12' cy='12' r='8'/%3E%3C/svg%3E",
              iconSize: [24, 24],
            }),
          })
            .addTo(map.current)
            .bindPopup("<strong>You</strong><br/>Current location");
        }

        map.current?.panTo([latitude, longitude], { animate: true, duration: 0.5 });

        if (!hasResolvedInitialAddress) {
          hasResolvedInitialAddress = true;
          void reverseGeocode(latitude, longitude).then((address) => {
            setCurrentLocation((previousLocation) =>
              previousLocation ? { ...previousLocation, address } : previousLocation,
            );
            currentMarker.current?.setPopupContent(`<strong>You</strong><br/>${address}`);
          });
        }
      },
      () => setMessage("Unable to refresh your current location"),
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Load the saved home location.
  useEffect(() => {
    const initializeLocations = async () => {
      try {
        setLoading(true);

        // Get user data including home location
        const userData = await apiCall("/auth/me");
        const homeData = userData.data?.user?.homeLocation || userData.user?.homeLocation;

        if (homeData?.latitude && homeData?.longitude) {
          setHomeLocation(homeData);

          // Add marker for home location
          if (map.current) {
            homeMarker.current = L.marker([homeData.latitude, homeData.longitude], {
              icon: L.icon({
                iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23EC4899'%3E%3Cpath d='M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z'/%3E%3C/svg%3E",
                iconSize: [24, 24],
              }),
            })
              .addTo(map.current)
              .bindPopup(`<strong>Home</strong><br/>${homeData.address || "Saved location"}`);
          }
        }
      } catch (error) {
        console.error("Error getting locations:", error);
        setMessage("Failed to get location");
      } finally {
        setLoading(false);
      }
    };

    initializeLocations();
  }, []);

  // Fetch safe and fastest options for the travel mode selected by the user.
  useEffect(() => {
    const fetchRoute = async () => {
      if (!currentLocation || !homeLocation) return;

      const now = Date.now();
      if (now - lastRouteRequest.current < 10000) return;
      lastRouteRequest.current = now;

      try {
        const loadRoute = async (
          mode: "drive" | "walk",
          routeType: "balanced" | "less_maneuvers" | "short",
          kind: RouteKind,
          title: string,
          description: string,
        ): Promise<RouteOption | null> => {
          if (!geoapifyApiKey) throw new Error("Geoapify API key is not configured");

          const query = new URLSearchParams({
            waypoints: `${currentLocation.latitude},${currentLocation.longitude}|${homeLocation.latitude},${homeLocation.longitude}`,
            mode,
            type: routeType,
            traffic: mode === "drive" ? "approximated" : "free_flow",
            details: "instruction_details",
            lang: "en",
            apiKey: geoapifyApiKey,
          });
          const response = await fetch(`https://api.geoapify.com/v1/routing?${query}`);
          if (!response.ok) throw new Error(`Geoapify routing error: ${response.status}`);

          const data: {
            features?: Array<{
              geometry: { coordinates: [number, number][][] };
              properties: {
                distance: number;
                time: number;
                legs?: Array<{
                  steps?: Array<{
                    instruction?: { text?: string };
                    transition_instruction?: string;
                    distance?: number;
                    from_index?: number;
                  }>;
                }>;
              };
            }>;
          } = await response.json();
          const result = data.features?.[0];

          if (!result) return null;

          return {
            kind,
            title,
            description,
            coordinates: result.geometry.coordinates.flat().map(([longitude, latitude]) => [latitude, longitude]),
            distance: result.properties.distance / 1000,
            duration: result.properties.time / 60,
            directions: (result.properties.legs ?? []).flatMap((leg, legIndex) =>
              (leg.steps ?? []).flatMap((step) => {
                const instruction = step.instruction?.text ?? step.transition_instruction;
                const point = result.geometry.coordinates[legIndex]?.[step.from_index ?? 0];
                return instruction && point
                  ? [{
                      instruction,
                      distance: step.distance ?? 0,
                      latitude: point[1],
                      longitude: point[0],
                    }]
                  : [];
              }),
            ),
          };
        };

        const [safeRoute, fastestRoute] = await Promise.all([
          loadRoute(
            travelMode === "vehicle" ? "drive" : "walk",
            travelMode === "vehicle" ? "less_maneuvers" : "balanced",
            "safe",
            "Safe Route",
            travelMode === "vehicle"
              ? "Fewer turns • main-road preference"
              : "Balanced walking route • fewer shortcuts",
          ),
          loadRoute(
            travelMode === "vehicle" ? "drive" : "walk",
            "short",
            "fastest",
            "Fastest Route",
            travelMode === "vehicle"
              ? "Shortest driving route"
              : "Shortest walking route • local streets",
          ),
        ]);

        setRouteOptions({
          ...(safeRoute ? { safe: safeRoute } : {}),
          ...(fastestRoute ? { fastest: fastestRoute } : {}),
        });
      } catch (error) {
        console.error("Error fetching route:", error);
        setRouteOptions({});
      }
    };

    fetchRoute();
  }, [currentLocation, homeLocation, travelMode]);

  useEffect(() => {
    if (!map.current) return;

    routeLayers.current.forEach((layer) => layer.remove());
    routeLayers.current = [];

    const availableRoutes = Object.values(routeOptions);
    if (availableRoutes.length === 0) return;

    routeLayers.current = availableRoutes.map((routeOption) => {
      const isSelected = routeOption.kind === selectedRoute;
      return L.polyline(routeOption.coordinates, {
        color: routeOption.kind === "safe" ? "rgb(236, 72, 153)" : "rgb(59, 130, 246)",
        weight: isSelected ? 5 : 3,
        opacity: isSelected ? 0.95 : 0.45,
      }).addTo(map.current as L.Map);
    });

    const routeToFocus = routeOptions[selectedRoute] ?? availableRoutes[0];
    map.current.fitBounds(L.latLngBounds(routeToFocus.coordinates), { padding: [40, 40] });
  }, [routeOptions, selectedRoute]);

  useEffect(() => {
    const activeRoute = routeOptions[selectedRoute];
    if (!isNavigating || !currentLocation || !activeRoute) return;

    const nextStep = activeRoute.directions[activeStepIndex + 1];
    if (!nextStep) return;

    if (getDistanceInMeters(currentLocation, nextStep) <= 30) {
      setActiveStepIndex((index) => index + 1);
    }
  }, [activeStepIndex, currentLocation, isNavigating, routeOptions, selectedRoute]);

  // Off-route detection: notify when user deviates from the suggested polyline by a threshold
  useEffect(() => {
    if (!isNavigating || !currentLocation) return;
    const activeRoute = routeOptions[selectedRoute];
    if (!activeRoute || !activeRoute.coordinates || activeRoute.coordinates.length === 0) return;

    const minDist = distanceToClosestPoint(currentLocation, activeRoute.coordinates);
    const thresholdMeters = 80; // notify if further than this from route

    if (minDist > thresholdMeters && !offRouteRef.current) {
      offRouteRef.current = true;
      setMessage("You're off the suggested route — re-route or check directions");

      try {
        if (typeof Notification !== "undefined") {
          if (Notification.permission === "granted") {
            new Notification("SafeHer — Off route", { body: "You appear to be off the suggested route." });
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((p) => {
              if (p === "granted") {
                new Notification("SafeHer — Off route", { body: "You appear to be off the suggested route." });
              }
            });
          }
        }
      } catch (e) {
        // ignore notification errors
      }

      try {
        navigator.vibrate?.(250);
      } catch {}
    } else if (minDist <= thresholdMeters && offRouteRef.current) {
      offRouteRef.current = false;
      setMessage("Back on route");
      setTimeout(() => setMessage(""), 2000);
    }
  }, [currentLocation, isNavigating, routeOptions, selectedRoute]);

  const handleSaveHomeLocation = async () => {
    if (!selectedHomeLocation) {
      setMessage("Choose a home location on the map first");
      return;
    }

    try {
      setSavingHome(true);
      const address = await reverseGeocode(selectedHomeLocation.latitude, selectedHomeLocation.longitude);
      await apiCall("/users/home-location", {
        method: "PATCH",
        body: JSON.stringify({
          latitude: selectedHomeLocation.latitude,
          longitude: selectedHomeLocation.longitude,
          address,
        }),
      });
      lastRouteRequest.current = 0;
      setHomeLocation({
        latitude: selectedHomeLocation.latitude,
        longitude: selectedHomeLocation.longitude,
        address,
      });
      if (homeMarker.current) {
        homeMarker.current
          .setLatLng([selectedHomeLocation.latitude, selectedHomeLocation.longitude])
          .setPopupContent(`<strong>Home</strong><br/>${address}`);
      } else if (map.current) {
        homeMarker.current = L.marker([selectedHomeLocation.latitude, selectedHomeLocation.longitude], {
          icon: L.icon({
            iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23EC4899'%3E%3Cpath d='M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z'/%3E%3C/svg%3E",
            iconSize: [24, 24],
          }),
        })
          .addTo(map.current)
          .bindPopup(`<strong>Home</strong><br/>${address}`);
      }
      setMessage(homeLocation ? "Home location updated!" : "Home location saved!");
      setIsLocationPickerOpen(false);
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      console.error("Error saving home location:", error);
      setMessage("Failed to save home location");
    } finally {
      setSavingHome(false);
    }
  };

  const openLocationPicker = () => {
    setSelectedHomeLocation(homeLocation ?? currentLocation);
    setIsLocationPickerOpen(true);
  };

  return (
    <ScreenShell>
      <PageHeader title="Safe Route" subtitle="Navigate home safely" />

      <div className="mb-4 overflow-hidden rounded-2xl">
        <div ref={mapContainer} className="glass h-56 w-full rounded-2xl" />
      </div>

      {message && <GlassCard className="mb-4 bg-primary/10 text-sm text-primary">{message}</GlassCard>}


      {Object.keys(routeOptions).length > 0 && (
        <GlassCard className="mb-4">
          <div className="mb-3 text-[10px] font-semibold uppercase text-muted-foreground">1. Select travel mode</div>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {(["vehicle", "walk"] as TravelMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  if (mode === travelMode) return;
                  lastRouteRequest.current = 0;
                  setSelectedRoute("safe");
                  setShowDirections(false);
                  setIsNavigating(false);
                  setActiveStepIndex(0);
                  setTravelMode(mode);
                }}
                className={`min-h-12 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                  travelMode === mode
                    ? "border-primary/70 bg-primary/15 text-white"
                    : "border-white/10 bg-white/5 text-muted-foreground"
                }`}
              >
                {mode === "vehicle" ? "By Vehicle" : "By Walk"}
              </button>
            ))}
          </div>
          <div className="mb-3 text-[10px] font-semibold uppercase text-muted-foreground">2. Choose a route</div>
          <div className="space-y-3">
            {(["safe", "fastest"] as RouteKind[]).map((kind) => {
              const routeOption = routeOptions[kind];
              if (!routeOption) return null;

              const isSelected = selectedRoute === kind;
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => {
                    setSelectedRoute(kind);
                    setShowDirections(false);
                    setIsNavigating(false);
                    setActiveStepIndex(0);
                  }}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    isSelected
                      ? kind === "safe"
                        ? "border-pink-400/70 bg-pink-500/10"
                        : "border-blue-400/70 bg-blue-500/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold">{routeOption.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{routeOption.description}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-bold">{Math.round(routeOption.duration)} min</div>
                      <div className="text-xs text-muted-foreground">{routeOption.distance.toFixed(1)} km</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>
      )}

      {!isNavigating && routeOptions[selectedRoute] && homeLocation && (
        <GradientButton
          onClick={() => {
            setActiveStepIndex(0);
            setIsNavigating(true);
            setShowDirections(true);
          }}
          className="w-full"
        >
          <Navigation className="h-4 w-4" />
          Start In-App Navigation
        </GradientButton>
      )}

      {isNavigating && routeOptions[selectedRoute] && (
        <NavigationPrompt
          route={routeOptions[selectedRoute]}
          activeStepIndex={activeStepIndex}
          onStop={() => {
            setIsNavigating(false);
            setShowDirections(false);
            setActiveStepIndex(0);
          }}
        />
      )}

      {Object.keys(routeOptions).length === 0 && homeLocation && !loading && (
        <div className="text-center text-sm text-muted-foreground">Route not available</div>
      )}

      {loading && (
        <div className="text-center text-sm text-muted-foreground">Loading routes...</div>
      )}

      <GlassCard className="mb-4 mt-4">
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <div className="text-sm font-semibold">
              {homeLocation ? "Home Location" : "Add Home Location"}
            </div>
            <div className="text-xs text-muted-foreground">
              {homeLocation?.address || "Save your current location as home"}
            </div>
          </div>
          <button
            onClick={openLocationPicker}
            disabled={!currentLocation}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {savingHome ? "Saving..." : homeLocation ? "Edit" : "Add"}
          </button>
        </div>
      </GlassCard>

      <LocationPickerDialog
        open={isLocationPickerOpen}
        onOpenChange={setIsLocationPickerOpen}
        initialLocation={selectedHomeLocation}
        onLocationChange={setSelectedHomeLocation}
        onSave={handleSaveHomeLocation}
        saving={savingHome}
      />
    </ScreenShell>
  );
}

function NavigationPrompt({
  route,
  activeStepIndex,
  onStop,
}: {
  route: RouteOption;
  activeStepIndex: number;
  onStop: () => void;
}) {
  const nextAction = route.directions[activeStepIndex] ?? route.directions[activeStepIndex + 1];

  return (
    <GlassCard className="mb-4 mt-4 border-primary/30 bg-primary/10">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-primary">Navigation active</div>
        <button
          type="button"
          onClick={onStop}
          className="rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-600"
        >
          Stop Navigation
        </button>
      </div>
      {nextAction ? (
        <>
          <div className="text-2xl font-bold">In {formatDistance(nextAction.distance)}</div>
          <div className="mt-1 text-base font-semibold">{shortInstruction(nextAction.instruction)}</div>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">Preparing your turn-by-turn directions...</div>
      )}
    </GlassCard>
  );
}

function shortInstruction(instruction: string) {
  if (!instruction) return "";
  // prefer first clause before comma or full instruction trimmed
  const first = instruction.split(/[.,]/)[0];
  // keep it short
  return first.length > 80 ? `${first.slice(0, 77)}...` : first;
}

function distanceToClosestPoint(from: Pick<LocationCoords, "latitude" | "longitude">, coords: [number, number][]) {
  // simple approach: compute min distance to vertex points (approximate but efficient)
  let min = Number.POSITIVE_INFINITY;
  for (const [lat, lon] of coords) {
    const d = getDistanceInMeters(from, { latitude: lat, longitude: lon } as NavigationStep);
    if (d < min) min = d;
  }
  return min;
}

function formatDistance(distanceInMeters: number) {
  if (distanceInMeters >= 1000) return `${(distanceInMeters / 1000).toFixed(1)} km`;
  return `${Math.max(1, Math.round(distanceInMeters))} m`;
}

function getDistanceInMeters(
  from: Pick<LocationCoords, "latitude" | "longitude">,
  to: Pick<NavigationStep, "latitude" | "longitude">,
) {
  const earthRadiusInMeters = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusInMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function LocationPickerDialog({
  open,
  onOpenChange,
  initialLocation,
  onLocationChange,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLocation: LocationCoords | null;
  onLocationChange: (location: LocationCoords) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const startingPoint: [number, number] = initialLocation
    ? [initialLocation.latitude, initialLocation.longitude]
    : [20.5937, 78.9629];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!bottom-0 !left-0 !top-auto !w-full !max-w-none !translate-x-0 !translate-y-0 !gap-0 !rounded-b-none !rounded-t-[28px] border-white/15 bg-slate-950/95 p-0 text-white shadow-2xl backdrop-blur-xl data-[state=closed]:!animate-none data-[state=open]:!animate-none">
        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-white/20" />
        <DialogHeader className="p-5 pb-4 text-left">
          <DialogTitle>Choose Home Location</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Click anywhere on the map to drop a pin, then save the selected location.
          </DialogDescription>
        </DialogHeader>

        <MapContainer
          center={startingPoint}
          zoom={initialLocation ? 16 : 5}
          zoomControl={false}
          className="h-[52dvh] min-h-72 w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationPickerEvents onLocationChange={onLocationChange} />
          {initialLocation && (
            <CircleMarker
              center={[initialLocation.latitude, initialLocation.longitude]}
              radius={10}
              pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#ec4899", fillOpacity: 1 }}
            />
          )}
        </MapContainer>

        <div className="flex items-center justify-between gap-3 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
          <div className="min-w-0 truncate text-xs text-muted-foreground">
            {initialLocation
              ? `${initialLocation.latitude.toFixed(6)}, ${initialLocation.longitude.toFixed(6)}`
              : "Map par ek location select karein"}
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={!initialLocation || saving}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Home"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LocationPickerEvents({
  onLocationChange,
}: {
  onLocationChange: (location: LocationCoords) => void;
}) {
  useMapEvents({
    click(event) {
      onLocationChange({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
  });

  return null;
}
