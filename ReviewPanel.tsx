"use client";

import { useEffect, useState } from "react";
import { addReview, getReviews, Review } from "@/lib/reviews";

export default function ReviewPanel({
  attractionId
}: {
  attractionId: string;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  async function refresh() {
    try {
      setReviews(await getReviews(attractionId));
    } catch {
      setReviews([]);
    }
  }

  useEffect(() => { refresh(); }, [attractionId]);

  async function submit() {
    try {
      await addReview(attractionId, rating, text);
      setText("");
      await refresh();
    } catch (err: any) {
      alert(err?.message || "Could not save review.");
    }
  }

  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <section className="reviewPanel">
      <div className="reviewSummary">
        <strong>{reviews.length ? `${average.toFixed(1)} ★` : "No ratings yet"}</strong>
        <span>{reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
      </div>

      <div className="reviewComposer">
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} star{n === 1 ? "" : "s"}</option>)}
        </select>
        <textarea
          placeholder="Share what you thought…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button onClick={submit}>Post review</button>
      </div>

      <div className="reviewList">
        {reviews.slice(0, 5).map(review => (
          <article key={review.id}>
            <strong>{"★".repeat(review.rating)}</strong>
            {review.review_text && <p>{review.review_text}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
