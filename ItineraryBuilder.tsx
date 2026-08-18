"use client";

import { useMemo, useState } from "react";
import { Attraction } from "@/lib/types";

type DayPlan = {
  date: string;
  stops: Attraction[];
  notes: string;
};

export default function ItineraryBuilder({
  trip,
  onRemoveTripStop
}: {
  trip: Attraction[];
  onRemoveTripStop: (id: string) => void;
}) {
  const [startDate, setStartDate] = useState("");
  const [days, setDays] = useState(3);
  const [notes, setNotes] = useState<Record<number, string>>({});

  const itinerary = useMemo<DayPlan[]>(() => {
    const result: DayPlan[] = Array.from({ length: Math.max(1, days) }, (_, i) => {
      let date = "";
      if (startDate) {
        const d = new Date(`${startDate}T12:00:00`);
        d.setDate(d.getDate() + i);
        date = d.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric"
        });
      }
      return { date, stops: [], notes: notes[i] || "" };
    });

    trip.forEach((stop, i) => {
      result[i % result.length].stops.push(stop);
    });

    return result;
  }, [trip, days, startDate, notes]);

  return (
    <section className="itinerary">
      <div className="sectionTitleRow">
        <div>
          <span className="eyebrow">PLAN YOUR DAYS</span>
          <h2>Trip itinerary</h2>
        </div>
      </div>

      <div className="itineraryControls">
        <label>
          Start date
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          Days
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[1,2,3,4,5,6,7,8,9,10,12,14].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="dayGrid">
        {itinerary.map((day, index) => (
          <article className="dayCard" key={index}>
            <div className="dayHeader">
              <strong>Day {index + 1}</strong>
              <span>{day.date}</span>
            </div>

            {day.stops.length ? (
              <div className="dayStops">
                {day.stops.map(stop => (
                  <div className="dayStop" key={stop.id}>
                    <div>
                      <strong>{stop.name}</strong>
                      <span>{stop.state} · {stop.category}</span>
                    </div>
                    <button onClick={() => onRemoveTripStop(stop.id)}>×</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="emptyDay">No stops yet.</p>
            )}

            <textarea
              placeholder="Notes, hotel, food ideas…"
              value={notes[index] || ""}
              onChange={(e) =>
                setNotes(current => ({ ...current, [index]: e.target.value }))
              }
            />
          </article>
        ))}
      </div>
    </section>
  );
}
