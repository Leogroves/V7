"use client";

import { Attraction } from "@/lib/types";

export default function SavedScreen({
  attractions,
  favorites,
  bucket,
  visited,
  onOpen
}: {
  attractions: Attraction[];
  favorites: Set<string>;
  bucket: Set<string>;
  visited: Set<string>;
  onOpen: (a: Attraction) => void;
}) {
  const groups = [
    { title: "Favorites", ids: favorites },
    { title: "Bucket List", ids: bucket },
    { title: "Visited", ids: visited }
  ];

  return (
    <section className="savedScreen">
      <div className="sectionTitleRow">
        <div>
          <span className="eyebrow">YOUR PLACES</span>
          <h2>Saved adventures</h2>
        </div>
      </div>

      {groups.map(group => {
        const items = attractions.filter(a => group.ids.has(a.id));
        return (
          <div className="savedGroup" key={group.title}>
            <div className="savedGroupTitle">
              <h3>{group.title}</h3>
              <span>{items.length}</span>
            </div>

            <div className="savedGrid">
              {items.length ? items.map(a => (
                <button className="savedCard" key={a.id} onClick={() => onOpen(a)}>
                  {a.image ? <img src={a.image} alt="" /> : <div className="savedPlaceholder">USA</div>}
                  <span>{a.name}</span>
                  <small>{a.state} · {a.category}</small>
                </button>
              )) : <p className="savedEmpty">Nothing here yet.</p>}
            </div>
          </div>
        );
      })}
    </section>
  );
}
