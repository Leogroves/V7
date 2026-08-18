"use client";

import { Attraction } from "@/lib/types";
import { milesBetween } from "@/lib/geo";

export default function RoadTripPlanner({
  stops,
  onRemove,
  onClear
}: {
  stops: Attraction[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  let total = 0;
  for (let i = 1; i < stops.length; i++) {
    total += milesBetween(
      stops[i - 1].latitude,
      stops[i - 1].longitude,
      stops[i].latitude,
      stops[i].longitude
    );
  }

  const routeUrl = stops.length
    ? `https://www.google.com/maps/dir/${stops.map(s => `${s.latitude},${s.longitude}`).join("/")}`
    : "";

  return (
    <section className="tripPlanner">
      <div className="tripHeader">
        <div>
          <span className="eyebrow">ROAD TRIP</span>
          <h3>{stops.length} stop{stops.length === 1 ? "" : "s"}</h3>
        </div>
        {stops.length > 0 && <button onClick={onClear}>Clear</button>}
      </div>

      {stops.length === 0 ? (
        <p className="tripEmpty">Open an attraction and add it to your road trip.</p>
      ) : (
        <>
          <ol className="tripStops">
            {stops.map((stop) => (
              <li key={stop.id}>
                <div>
                  <strong>{stop.name}</strong>
                  <span>{stop.state}</span>
                </div>
                <button onClick={() => onRemove(stop.id)}>Remove</button>
              </li>
            ))}
          </ol>
          <div className="tripSummary">
            <span>Approx. straight-line distance</span>
            <strong>{Math.round(total).toLocaleString()} mi</strong>
          </div>
          <a className="routeButton" href={routeUrl} target="_blank" rel="noreferrer">
            Open route in Google Maps ↗
          </a>
        </>
      )}
    </section>
  );
}
