import { createFileRoute } from "@tanstack/react-router";
import { Car, Share2, Route as RouteIcon, ShieldCheck, MapPin, Navigation, AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ScreenShell } from "@/components/safeher/screen-shell";
import { PageHeader } from "@/components/safeher/page-header";
import { GlassCard } from "@/components/safeher/glass-card";

export const Route = createFileRoute("/app/ride")({
  head: () => ({ meta: [{ title: "Ride Guardian — SafeHer AI" }] }),
  component: Ride,
});

function Ride() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const userMarker = useRef<L.Marker | null>(null);
  const routeLine = useRef<L.Polyline | null>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [startLocation, setStartLocation] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [deviation, setDeviation] = useState("Safe Route");
  const [distanceOffRoute, setDistanceOffRoute] = useState(0);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [eta, setEta] = useState<string>("–");

  // Helper: Haversine distance in meters
  function haversine([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]) {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371e3;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Helper: Distance from point to polyline (in meters)
  function minDistanceToRoute(point: [number, number], route: [number, number][]) {
    let minDist = Infinity;
    for (let i = 0; i < route.length - 1; i++) {
      const segStart = route[i];
      const segEnd = route[i + 1];
      // project point onto segment, then clamp to segment
      const dist = pointToSegmentDistance(point, segStart, segEnd);
      if (dist < minDist) minDist = dist;
    }
    return minDist;
  }

  // Helper: Point to segment (in meters)
  function pointToSegmentDistance(
    p: [number, number],
    v: [number, number],
    w: [number, number]
  ) {
    const segmentLength = Math.sqrt(
      (w[0] - v[0]) ** 2 +
      (w[1] - v[1]) ** 2
    );

    if (segmentLength === 0) {
      return haversine(p, v);
    }

    let t =
      ((p[0] - v[0]) * (w[0] - v[0]) +
        (p[1] - v[1]) * (w[1] - v[1])) /
      (segmentLength ** 2);

    t = Math.max(0, Math.min(1, t));

    const nearest: [number, number] = [
      v[0] + t * (w[0] - v[0]),
      v[1] + t * (w[1] - v[1]),
    ];

    return haversine(p, nearest);
  }

  // Effect: Initialize map and handle live updates
  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstance.current) return; // only once

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentLocation([latitude, longitude]);
        setStartLocation([latitude, longitude]);
        const map = L.map(mapRef.current!).setView([latitude, longitude], 15);
        mapInstance.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);
        // User marker
        const marker = L.marker([latitude, longitude], {
          icon: L.icon({
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
          }),
        }).addTo(map);
        marker.bindPopup("Current Location");
        userMarker.current = marker;

        // Map click to select destination
        map.on("click", function (e: any) {
          const latlng: [number, number] = [e.latlng.lat, e.latlng.lng];
          setDestination(latlng);
        });
      },
      (err) => {
        alert("Could not get your location: " + err.message);
      }
    );
    // eslint-disable-next-line
  }, []);

  // Effect: Draw route when destination is set
  useEffect(() => {
    if (!startLocation || !destination || !mapInstance.current) return;
    // Remove previous route line
    if (routeLine.current) {
      routeLine.current.remove();
      routeLine.current = null;
    }
    // Fetch route from OSRM API
    const [lat1, lng1] = startLocation;
    const [lat2, lng2] = destination;
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.routes && data.routes[0]) {
          const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );
          setRouteCoords(coords);
          routeLine.current = L.polyline(coords, { color: "#6366f1", weight: 6 }).addTo(mapInstance.current!);
          mapInstance.current!.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
          // Estimate ETA (seconds to min)
          if (typeof data.routes[0].duration === "number") {
            const minutes = Math.max(1, Math.ceil(data.routes[0].duration / 60));
            setEta(`${minutes} min`);
          } else {
            setEta("–");
          }
        }
      });
  }, [startLocation, destination]);

  // Effect: Watch user location
  useEffect(() => {
    if (!mapInstance.current) return;
    let watchId: number | null = null;
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentLocation([latitude, longitude]);
        // Move marker and center map
        if (userMarker.current) {
          userMarker.current.setLatLng([latitude, longitude]);
        }
        // Optionally: mapInstance.current!.panTo([latitude, longitude]);
      },
      (err) => {
        // ignore
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Effect: Deviation check
  useEffect(() => {
    if (!currentLocation || !routeCoords || routeCoords.length < 2) {
      setDeviation("Safe Route");
      setDistanceOffRoute(0);
      return;
    }
    const dist = minDistanceToRoute(currentLocation, routeCoords);
    setDistanceOffRoute(Math.round(dist));
    if (dist > 80) {
      setDeviation("Off Route");
    } else {
      setDeviation("Safe Route");
    }
  }, [currentLocation, routeCoords]);

  return (
    <ScreenShell>
      <PageHeader title="Ride Guardian" subtitle="AI monitors your journey" />
      <GlassCard className="mb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-brand text-white shadow-glow">
            <Car className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground">Live GPS · {currentLocation ? "Journey Started" : "Waiting for location"}</div>
            <div className="truncate font-semibold">
              {currentLocation
                ? `${currentLocation[0].toFixed(5)}, ${currentLocation[1].toFixed(5)}`
                : "–"}
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${deviation === "Safe Route" ? "gradient-brand" : "bg-red-500"}`}>
            {deviation === "Safe Route" ? "Safe" : "Alert"}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted grid place-items-center">
            <Navigation className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="font-semibold">
              {destination
                ? `${destination[0].toFixed(5)}, ${destination[1].toFixed(5)}`
                : "Tap map to set destination"}
            </div>
            <div className="text-xs text-muted-foreground">
              {destination ? "Selected Destination" : "Waiting"}
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="mb-4">
        <div className="flex items-center justify-between text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Pickup</div>
            <div className="font-semibold">
              {currentLocation
                ? `${currentLocation[0].toFixed(5)}, ${currentLocation[1].toFixed(5)}`
                : "–"}
            </div>
          </div>
          <RouteIcon className="h-5 w-5 text-primary" />
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Destination</div>
            <div className="font-semibold">
              {destination
                ? `${destination[0].toFixed(5)}, ${destination[1].toFixed(5)}`
                : "Tap map"}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="ETA" value={eta} />
          <Stat
            label="Deviation"
            value={
              deviation === "Safe Route"
                ? distanceOffRoute + " m"
                : (
                  <span className="text-red-500 font-bold">
                    {distanceOffRoute} m
                  </span>
                )
            }
          />
          <Stat
            label="Route"
            value={
              deviation === "Safe Route" ? (
                <span className="text-green-600 font-bold">Expected</span>
              ) : (
                <span className="text-red-500 font-bold">Off Route</span>
              )
            }
          />
        </div>
      </GlassCard>
      <div
        ref={mapRef}
        className="mb-4 rounded-2xl overflow-hidden border border-muted shadow-soft"
        style={{ height: 320, width: "100%" }}
      />
    </ScreenShell>
  );
}

function Stat({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-muted/40 p-3">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-bold">{value}</div>
    </div>
  );
}
function ActionCard({ icon: Icon, label, active }: { icon: typeof Share2; label: string; active?: boolean }) {
  return (
    <div className={`glass flex items-center gap-3 rounded-2xl p-4 shadow-soft ${active ? "ring-2 ring-primary/50" : ""}`}>
      <div className="grid h-10 w-10 place-items-center rounded-xl gradient-brand text-white"><Icon className="h-5 w-5" /></div>
      <div className="text-sm font-semibold">{label}</div>
    </div>
  );
}