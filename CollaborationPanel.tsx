"use client";

import { useState } from "react";
import { createShareLink } from "@/lib/trips";

export default function CollaborationPanel({ tripId }: { tripId: string | null }) {
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  async function makeLink() {
    if (!tripId) return;
    setBusy(true);
    try {
      const url = await createShareLink(tripId);
      if (url) {
        setLink(url);
        await navigator.clipboard?.writeText(url);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="collaborationPanel">
      <span className="eyebrow">SHARE & COLLABORATE</span>
      <h3>Plan together</h3>
      <p>Create a shareable trip link. The database also includes collaborator memberships for the next server-side invite step.</p>
      <button onClick={makeLink} disabled={!tripId || busy}>
        {busy ? "Creating…" : "Create & copy trip link"}
      </button>
      {link && <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} />}
    </section>
  );
}
