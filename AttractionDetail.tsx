"use client";

import { Attraction } from "@/lib/types";
import { directionsUrl } from "@/lib/geo";
import ReviewPanel from "@/components/ReviewPanel";
import PhotoUploadPanel from "@/components/PhotoUploadPanel";

export default function AttractionDetail({
  attraction,
  onClose,
  favorite,
  visited,
  bucket,
  onFavorite,
  onVisited,
  onBucket,
  onAddTrip,
  distance
}: {
  attraction: Attraction | null;
  onClose: () => void;
  favorite: boolean;
  visited: boolean;
  bucket: boolean;
  onFavorite: () => void;
  onVisited: () => void;
  onBucket: () => void;
  onAddTrip: () => void;
  distance?: number;
}) {
  if (!attraction) return null;

  const photos = attraction.images?.length
    ? attraction.images
    : attraction.image
      ? [attraction.image]
      : [];

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="detailPanel" onClick={(e) => e.stopPropagation()}>
        <button className="closeButton" onClick={onClose}>×</button>

        {photos.length > 0 && (
          <div className="photoStrip">
            {photos.slice(0, 4).map((src, i) => (
              <img key={`${src}-${i}`} src={src} alt="" />
            ))}
          </div>
        )}

        <div className="detailContent">
          <span className="source">{attraction.source}</span>
          <h2>{attraction.name}</h2>
          <p className="detailMeta">
            {attraction.state} · {attraction.category}
            {distance != null ? ` · ${distance.toFixed(1)} miles away` : ""}
          </p>

          <p className="detailDescription">{attraction.description}</p>

          {attraction.address && <p><strong>Address:</strong> {attraction.address}</p>}
          {attraction.phone && <p><strong>Phone:</strong> {attraction.phone}</p>}

          <div className="detailActions">
            <button onClick={onFavorite}>{favorite ? "★ Favorited" : "☆ Favorite"}</button>
            <button onClick={onVisited}>{visited ? "✓ Visited" : "Mark visited"}</button>
            <button onClick={onBucket}>{bucket ? "✓ Bucket list" : "Add to bucket list"}</button>
            <button onClick={onAddTrip}>＋ Add to road trip</button>
          </div>

          <PhotoUploadPanel attractionId={attraction.id} />

          <ReviewPanel attractionId={attraction.id} />

          <div className="detailLinks">
            <a href={directionsUrl(attraction.latitude, attraction.longitude)} target="_blank" rel="noreferrer">
              Get directions ↗
            </a>
            {attraction.website && (
              <a href={attraction.website} target="_blank" rel="noreferrer">
                Official page ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
