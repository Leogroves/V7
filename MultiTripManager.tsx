"use client";

import { useEffect, useState } from "react";
import { TripRecord, createTrip, deleteTrip, listTrips, renameTrip, createShareLink, saveTripReminder } from "@/lib/trips";
import { scheduleLocalTripNotification } from "@/lib/notifications";

export default function MultiTripManager({
  activeTripId,
  onSelectTrip
}: {
  activeTripId: string | null;
  onSelectTrip: (id: string) => void;
}) {
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [reminderTrip, setReminderTrip] = useState<string | null>(null);
  const [reminderAt, setReminderAt] = useState("");

  async function refresh() {
    try {
      setTrips(await listTrips());
    } catch {}
  }

  useEffect(() => { refresh(); }, []);

  async function handleCreate() {
    const trip = await createTrip(newName);
    if (!trip) return;
    setNewName("");
    await refresh();
    onSelectTrip(trip.id);
  }

  async function handleRename(id: string) {
    await renameTrip(id, editName.trim() || "My USA Trip");
    setEditing(null);
    await refresh();
  }

  async function handleDelete(id: string) {
    await deleteTrip(id);
    await refresh();
    if (activeTripId === id) {
      const remaining = trips.filter(t => t.id !== id);
      if (remaining[0]) onSelectTrip(remaining[0].id);
    }
  }

  async function handleShare(id: string) {
    try {
      const url = await createShareLink(id);
      if (!url) return;
      if (navigator.share) {
        await navigator.share({ title: "USA Attractions Trip", url });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Share link copied.");
      }
    } catch {}
  }

  async function handleReminder() {
    if (!reminderTrip || !reminderAt) return;
    await saveTripReminder(reminderTrip, new Date(reminderAt).toISOString(), "USA Attractions trip reminder");
    await scheduleLocalTripNotification(
      "USA Attractions",
      "Your trip is coming up!",
      new Date(reminderAt)
    );
    setReminderTrip(null);
    setReminderAt("");
    alert("Reminder saved.");
  }

  return (
    <section className="multiTrips">
      <div className="sectionTitleRow">
        <div>
          <span className="eyebrow">YOUR TRIPS</span>
          <h2>Multiple adventures</h2>
        </div>
      </div>

      <div className="newTripRow">
        <input
          placeholder="New trip name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button onClick={handleCreate}>Create trip</button>
      </div>

      <div className="tripList">
        {trips.length ? trips.map(trip => (
          <div className={`tripListItem ${activeTripId === trip.id ? "active" : ""}`} key={trip.id}>
            <button className="tripSelect" onClick={() => onSelectTrip(trip.id)}>
              {editing === trip.id ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span>
                  <strong>{trip.name}</strong>
                  <small>{trip.day_count} day plan</small>
                </span>
              )}
            </button>

            <div className="tripItemActions">
              {editing === trip.id ? (
                <button onClick={() => handleRename(trip.id)}>Save</button>
              ) : (
                <button onClick={() => { setEditing(trip.id); setEditName(trip.name); }}>Rename</button>
              )}
              <button onClick={() => handleShare(trip.id)}>Share</button>
              <button onClick={() => setReminderTrip(trip.id)}>Reminder</button>
              <button onClick={() => handleDelete(trip.id)}>Delete</button>
            </div>
          </div>
        )) : <p className="savedEmpty">Sign in to create cloud-synced trips.</p>}
      </div>

      {reminderTrip && (
        <div className="reminderBox">
          <strong>Trip reminder</strong>
          <input
            type="datetime-local"
            value={reminderAt}
            onChange={(e) => setReminderAt(e.target.value)}
          />
          <button onClick={handleReminder}>Save reminder</button>
          <button onClick={() => setReminderTrip(null)}>Cancel</button>
        </div>
      )}
    </section>
  );
}
