"use client";

import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { Attraction } from "@/lib/types";

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

export default function AttractionsMap({
  attractions,
  favorites,
  toggleFavorite,
  onOpen,
  userLocation
}: {
  attractions: Attraction[];
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  onOpen: (a: Attraction) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}) {
  return (
    <MapContainer center={[39.5, -98.35]} zoom={4} minZoom={3} className="map">
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {userLocation && (
        <CircleMarker
          center={[userLocation.latitude, userLocation.longitude]}
          radius={9}
          pathOptions={{ weight: 3 }}
        >
          <Popup>Your location</Popup>
        </CircleMarker>
      )}

      {attractions.map((a) => (
        <Marker key={a.id} position={[a.latitude, a.longitude]} icon={icon}>
          <Popup>
            <div className="popup">
              <strong>{a.name}</strong>
              <span>{a.state} · {a.category}</span>
              <button onClick={() => onOpen(a)}>View details</button>
              <button onClick={() => toggleFavorite(a.id)}>
                {favorites.has(a.id) ? "★ Favorited" : "☆ Favorite"}
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
