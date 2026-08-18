"use client";

import { useEffect, useState } from "react";
import { getAttractionPhotos, uploadAttractionPhoto } from "@/lib/photos";

export default function PhotoUploadPanel({ attractionId }: { attractionId: string }) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try { setPhotos(await getAttractionPhotos(attractionId)); }
    catch { setPhotos([]); }
  }

  useEffect(() => { refresh(); }, [attractionId]);

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      await uploadAttractionPhoto(attractionId, file, caption);
      setCaption("");
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Photo upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="photoUploadPanel">
      <div className="photoUploadHead">
        <strong>Traveler photos</strong>
        <span>{photos.length}</span>
      </div>

      {photos.length > 0 && (
        <div className="travelerPhotoGrid">
          {photos.slice(0, 8).map(p => (
            <figure key={p.id}>
              <img src={p.image_url} alt={p.caption || ""} />
              {p.caption && <figcaption>{p.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}

      <div className="photoComposer">
        <input
          placeholder="Photo caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <label className="uploadButton">
          {busy ? "Uploading…" : "Add photo"}
          <input
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </label>
      </div>
    </section>
  );
}
