import { useEffect } from "react";
import { MapContainer, Marker, Circle, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type LocationMapProps = {
  latitude: number | null;
  longitude: number | null;
  accuracy?: number;
  className?: string;
  zoom?: number;
};

const DEFAULT_CENTER: L.LatLngExpression = [20.5937, 78.9629];

const locationIcon = L.divIcon({
  className: "safeher-location-marker",
  html: '<span class="safeher-location-pulse"></span><span class="safeher-location-dot"><span></span></span>',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});


export function LocationMap({ latitude, longitude, accuracy = 0, className, zoom = 17 }: LocationMapProps) {
  const hasLocation = latitude !== null && longitude !== null;
  const center: L.LatLngExpression = hasLocation ? [latitude, longitude] : DEFAULT_CENTER;

  return (
    <div className={className}>
      <style>{locationMarkerStyles}</style>
      <MapContainer center={center} zoom={zoom} zoomControl={false} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasLocation && (
          <>
            <MapFollower latitude={latitude} longitude={longitude} />
            {accuracy > 0 && <Circle center={[latitude, longitude]} radius={accuracy} pathOptions={circleStyle} />}
            <Marker position={[latitude, longitude]} icon={locationIcon} zIndexOffset={1000} />
          </>
        )}
      </MapContainer>
    </div>
  );
}

const circleStyle = { color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.12, weight: 1 };

function MapFollower({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([latitude, longitude], map.getZoom(), { animate: true, duration: 0.8 });
  }, [latitude, longitude, map]);

  return null;
}

const locationMarkerStyles = `
  .safeher-location-marker { background: transparent; border: 0; }
  .safeher-location-pulse { position: absolute; inset: 2px; border-radius: 9999px; background: rgba(59, 130, 246, .34); animation: safeher-location-pulse 1.8s ease-out infinite; }
  .safeher-location-dot { position: absolute; inset: 10px; display: grid; place-items: center; border: 3px solid white; border-radius: 9999px; background: #2563eb; box-shadow: 0 0 0 5px rgba(37, 99, 235, .25), 0 6px 18px rgba(37, 99, 235, .7); animation: safeher-location-bob .8s ease-in-out infinite alternate; }
  .safeher-location-dot span { width: 5px; height: 5px; border-radius: 9999px; background: white; }
  @keyframes safeher-location-pulse { 0% { transform: scale(.55); opacity: .9; } 100% { transform: scale(1.25); opacity: 0; } }
  @keyframes safeher-location-bob { from { transform: translateY(0); } to { transform: translateY(-2px); } }
`;
