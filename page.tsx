"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Attraction } from "@/lib/types";
import { milesBetween } from "@/lib/geo";
import { recommendAttractions } from "@/lib/recommend";
import AttractionDetail from "@/components/AttractionDetail";
import RoadTripPlanner from "@/components/RoadTripPlanner";
import ItineraryBuilder from "@/components/ItineraryBuilder";
import AccountPanel from "@/components/AccountPanel";
import AppNav, { AppSection } from "@/components/AppNav";
import SavedScreen from "@/components/SavedScreen";
import SyncStatus from "@/components/SyncStatus";
import { getSupabase } from "@/lib/cloud";
import { ensureTrip, loadCloudIds, loadTripStops, syncCloudIds, syncTripStops } from "@/lib/sync";
import MultiTripManager from "@/components/MultiTripManager";
import CollaborationPanel from "@/components/CollaborationPanel";
import { loadOfflineAttractions, saveOfflineAttractions } from "@/lib/offline";

const AttractionsMap = dynamic(() => import("@/components/AttractionsMap"), {
  ssr: false
});

const STATES = [
  "ALL","AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY"
];

function getSavedSet(key: string) {
  if (typeof window === "undefined") return new Set<string>();
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(key) || "[]"));
  } catch {
    return new Set<string>();
  }
}

export default function Home() {
  const [section, setSection] = useState<AppSection>("explore");
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [mode, setMode] = useState("sample");
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [bucket, setBucket] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Attraction | null>(null);
  const [userLocation, setUserLocation] = useState<{latitude:number; longitude:number} | null>(null);
  const [nearMeOnly, setNearMeOnly] = useState(false);
  const [trip, setTrip] = useState<Attraction[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("Saved on this device");
  const [cloudTripId, setCloudTripId] = useState<string | null>(null);

  useEffect(() => {
    setFavorites(getSavedSet("usa-attraction-favorites"));
    setVisited(getSavedSet("usa-attraction-visited"));
    setBucket(getSavedSet("usa-attraction-bucket"));

    try {
      const cached: Attraction[] = JSON.parse(localStorage.getItem("usa-attraction-trip-data") || "[]");
      setTrip(cached);
    } catch {}
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    async function hydrateCloud() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setSignedIn(false);
        return;
      }

      setSignedIn(true);
      setSyncing(true);
      setSyncMessage("Loading cloud data");

      try {
        const [favIds, visitedIds, bucketIds, tripRow] = await Promise.all([
          loadCloudIds("favorites"),
          loadCloudIds("visited_places"),
          loadCloudIds("bucket_list"),
          ensureTrip()
        ]);

        setFavorites(new Set(favIds));
        setVisited(new Set(visitedIds));
        setBucket(new Set(bucketIds));

        if (tripRow?.id) {
          setCloudTripId(tripRow.id);
          const cloudStops = await loadTripStops(tripRow.id);
          if (cloudStops.length) {
            setTrip(cloudStops);
            localStorage.setItem("usa-attraction-trip-data", JSON.stringify(cloudStops));
          }
        }

        localStorage.setItem("usa-attraction-favorites", JSON.stringify(favIds));
        localStorage.setItem("usa-attraction-visited", JSON.stringify(visitedIds));
        localStorage.setItem("usa-attraction-bucket", JSON.stringify(bucketIds));
        setSyncMessage("Up to date");
      } catch {
        setSyncMessage("Cloud sync needs setup");
      } finally {
        setSyncing(false);
      }
    }

    hydrateCloud();

    const { data: listener } = supabase.auth.onAuthStateChange(() => hydrateCloud());
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (state !== "ALL") params.set("state", state);

      try {
        const res = await fetch(`/api/attractions?${params}`);
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        const items = data.attractions ?? [];
        setAttractions(items);
        setMode(data.mode ?? "sample");
        if (items.length) saveOfflineAttractions(items);
      } catch {
        const cached = loadOfflineAttractions();
        if (cached.length) {
          setAttractions(cached);
          setMode("offline");
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, state]);

  const categories = useMemo(
    () => ["ALL", ...Array.from(new Set(attractions.map((a) => a.category))).sort()],
    [attractions]
  );

  const visible = useMemo(() => {
    let list = category === "ALL"
      ? attractions
      : attractions.filter(a => a.category === category);

    if (nearMeOnly && userLocation) {
      list = list
        .map(a => ({
          attraction: a,
          distance: milesBetween(
            userLocation.latitude,
            userLocation.longitude,
            a.latitude,
            a.longitude
          )
        }))
        .filter(x => x.distance <= 250)
        .sort((a, b) => a.distance - b.distance)
        .map(x => x.attraction);
    }
    return list;
  }, [attractions, category, nearMeOnly, userLocation]);

  const recommendations = useMemo(
    () => recommendAttractions(attractions, favorites, visited, bucket, userLocation).slice(0, 8),
    [attractions, favorites, visited, bucket, userLocation]
  );

  function persistSet(
    key: string,
    updater: (set: Set<string>) => void,
    setter: React.Dispatch<React.SetStateAction<Set<string>>>
  ) {
    setter(current => {
      const next = new Set(current);
      updater(next);
      const ids = [...next];
      localStorage.setItem(key, JSON.stringify(ids));

      if (signedIn) {
        const kind =
          key === "usa-attraction-favorites" ? "favorites" :
          key === "usa-attraction-visited" ? "visited_places" :
          "bucket_list";

        setSyncing(true);
        setSyncMessage("Saving changes");
        syncCloudIds(kind, ids)
          .then(() => setSyncMessage("Up to date"))
          .catch(() => setSyncMessage("Cloud save failed"))
          .finally(() => setSyncing(false));
      }

      return next;
    });
  }

  const toggleFavorite = (id: string) =>
    persistSet("usa-attraction-favorites", s => s.has(id) ? s.delete(id) : s.add(id), setFavorites);

  const toggleVisited = (id: string) =>
    persistSet("usa-attraction-visited", s => s.has(id) ? s.delete(id) : s.add(id), setVisited);

  const toggleBucket = (id: string) =>
    persistSet("usa-attraction-bucket", s => s.has(id) ? s.delete(id) : s.add(id), setBucket);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      setUserLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      });
      setNearMeOnly(true);
    });
  }

  function saveTrip(next: Attraction[]) {
    setTrip(next);
    localStorage.setItem("usa-attraction-trip-data", JSON.stringify(next));

    if (signedIn && cloudTripId) {
      setSyncing(true);
      setSyncMessage("Saving trip");
      syncTripStops(cloudTripId, next)
        .then(() => setSyncMessage("Up to date"))
        .catch(() => setSyncMessage("Trip sync failed"))
        .finally(() => setSyncing(false));
    }
  }

  function addTripStop(a: Attraction) {
    if (trip.some(x => x.id === a.id)) return;
    saveTrip([...trip, a]);
  }

  function removeTripStop(id: string) {
    saveTrip(trip.filter(x => x.id !== id));
  }

  function clearTrip() {
    saveTrip([]);
  }

  async function selectCloudTrip(id: string) {
    setCloudTripId(id);
    setSyncing(true);
    setSyncMessage("Loading trip");
    try {
      const stops = await loadTripStops(id);
      setTrip(stops);
      localStorage.setItem("usa-attraction-trip-data", JSON.stringify(stops));
      setSyncMessage("Up to date");
    } catch {
      setSyncMessage("Trip load failed");
    } finally {
      setSyncing(false);
    }
  }

  const selectedDistance = selected && userLocation
    ? milesBetween(userLocation.latitude, userLocation.longitude, selected.latitude, selected.longitude)
    : undefined;

  return (
    <main className="appShell">
      <header className="heroHeader">
        <div>
          <span className="eyebrow">EXPLORE AMERICA</span>
          <h1>USA Attractions</h1>
          <p>Find unforgettable places across all 50 states.</p>
        </div>
        <div className="status">{mode === "live" ? "● Live data" : mode === "offline" ? "● Offline cache" : "● Demo mode"}</div>
      </header>

      <SyncStatus signedIn={signedIn} syncing={syncing} message={syncMessage} />

      {section === "explore" && (
        <>
          <section className="controls premiumControls">
            <input
              aria-label="Search attractions"
              placeholder="Where do you want to explore?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select value={state} onChange={(e) => setState(e.target.value)}>
              {STATES.map(s => (
                <option key={s} value={s}>{s === "ALL" ? "All states" : s}</option>
              ))}
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map(c => (
                <option key={c} value={c}>{c === "ALL" ? "All categories" : c}</option>
              ))}
            </select>
            <button className="nearMeButton" onClick={useMyLocation}>◎ Near Me</button>
          </section>

          <section className="recommendSection">
            <div className="sectionTitleRow">
              <div>
                <span className="eyebrow">FOR YOU</span>
                <h2>Recommended adventures</h2>
              </div>
            </div>

            <div className="recommendRail">
              {recommendations.map(a => (
                <button key={a.id} className="recommendCard" onClick={() => setSelected(a)}>
                  {a.image ? <img src={a.image} alt="" /> : <div className="recommendPlaceholder">USA</div>}
                  <div>
                    <strong>{a.name}</strong>
                    <span>{a.state} · {a.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="statsRow">
            <span><strong>{favorites.size}</strong> favorites</span>
            <span><strong>{visited.size}</strong> visited</span>
            <span><strong>{bucket.size}</strong> bucket list</span>
            <span><strong>{trip.length}</strong> trip stops</span>
          </section>

          <section className="workspace">
            <aside>
              <div className="resultsHeader">
                <strong>{loading ? "Loading…" : `${visible.length} attractions`}</strong>
                {nearMeOnly && (
                  <button className="textButton" onClick={() => setNearMeOnly(false)}>Show all</button>
                )}
              </div>

              <div className="cards">
                {visible.map(a => {
                  const distance = userLocation
                    ? milesBetween(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude)
                    : null;

                  return (
                    <article key={a.id} onClick={() => setSelected(a)} className="clickableCard">
                      {a.image && <img src={a.image} alt="" />}
                      <div className="cardBody">
                        <div className="cardTop">
                          <span className="source">{a.source}</span>
                          <button className="heart" onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(a.id);
                          }}>
                            {favorites.has(a.id) ? "★" : "☆"}
                          </button>
                        </div>
                        <h2>{a.name}</h2>
                        <p className="meta">
                          {a.state} · {a.category}
                          {distance != null ? ` · ${distance.toFixed(0)} mi` : ""}
                        </p>
                        <p className="desc">{a.description}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </aside>

            <div className="mapWrap">
              <AttractionsMap
                attractions={visible}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                onOpen={setSelected}
                userLocation={userLocation}
              />
            </div>
          </section>
        </>
      )}

      {section === "saved" && (
        <SavedScreen
          attractions={attractions}
          favorites={favorites}
          bucket={bucket}
          visited={visited}
          onOpen={setSelected}
        />
      )}

      {section === "trip" && (
        <>
          {signedIn && (
            <MultiTripManager
              activeTripId={cloudTripId}
              onSelectTrip={selectCloudTrip}
            />
          )}
          {signedIn && <CollaborationPanel tripId={cloudTripId} />}
          <RoadTripPlanner
            stops={trip}
            onRemove={removeTripStop}
            onClear={clearTrip}
          />
          <ItineraryBuilder
            trip={trip}
            onRemoveTripStop={removeTripStop}
          />
        </>
      )}

      {section === "account" && <AccountPanel onAuthChange={setSignedIn} />}

      <AppNav active={section} onChange={setSection} />

      <AttractionDetail
        attraction={selected}
        onClose={() => setSelected(null)}
        favorite={selected ? favorites.has(selected.id) : false}
        visited={selected ? visited.has(selected.id) : false}
        bucket={selected ? bucket.has(selected.id) : false}
        onFavorite={() => selected && toggleFavorite(selected.id)}
        onVisited={() => selected && toggleVisited(selected.id)}
        onBucket={() => selected && toggleBucket(selected.id)}
        onAddTrip={() => selected && addTripStop(selected)}
        distance={selectedDistance}
      />
    </main>
  );
}
