"use client";

export default function SyncStatus({
  signedIn,
  syncing,
  message
}: {
  signedIn: boolean;
  syncing: boolean;
  message: string;
}) {
  return (
    <div className={`syncStatus ${signedIn ? "online" : "offline"}`}>
      <span>{signedIn ? "☁" : "◌"}</span>
      <div>
        <strong>{signedIn ? (syncing ? "Syncing…" : "Cloud sync on") : "Local-only mode"}</strong>
        <small>{message}</small>
      </div>
    </div>
  );
}
