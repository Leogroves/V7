import { Attraction } from "./types";
import { getSupabase } from "./cloud";

type ListKind = "favorites" | "visited_places" | "bucket_list";

export async function loadCloudIds(kind: ListKind): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from(kind)
    .select("attraction_id")
    .eq("user_id", user.id);

  if (error) throw error;
  return (data ?? []).map((r: any) => r.attraction_id);
}

export async function syncCloudIds(kind: ListKind, ids: string[]) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  const { error: deleteError } = await supabase
    .from(kind)
    .delete()
    .eq("user_id", user.id);

  if (deleteError) throw deleteError;

  if (!ids.length) return;

  const rows = ids.map(attraction_id => ({
    user_id: user.id,
    attraction_id
  }));

  const { error: insertError } = await supabase.from(kind).insert(rows);
  if (insertError) throw insertError;
}

export async function ensureTrip(name = "My USA Trip") {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data: existing } = await supabase
    .from("trips")
    .select("id,name,start_date,day_count")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("trips")
    .insert({ user_id: user.id, name })
    .select("id,name,start_date,day_count")
    .single();

  if (error) throw error;
  return data;
}

export async function loadTripStops(tripId: string): Promise<Attraction[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("trip_stops")
    .select("*")
    .eq("trip_id", tripId)
    .order("position", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    id: r.attraction_id,
    name: r.attraction_name,
    description: "",
    state: r.state ?? "",
    category: r.category ?? "",
    latitude: r.latitude ?? 0,
    longitude: r.longitude ?? 0,
    source: "Sample"
  }));
}

export async function syncTripStops(tripId: string, stops: Attraction[]) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error: deleteError } = await supabase
    .from("trip_stops")
    .delete()
    .eq("trip_id", tripId);

  if (deleteError) throw deleteError;

  if (!stops.length) return;

  const rows = stops.map((a, position) => ({
    trip_id: tripId,
    attraction_id: a.id,
    attraction_name: a.name,
    state: a.state,
    category: a.category,
    latitude: a.latitude,
    longitude: a.longitude,
    position
  }));

  const { error } = await supabase.from("trip_stops").insert(rows);
  if (error) throw error;
}
