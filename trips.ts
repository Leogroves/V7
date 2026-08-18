import { Attraction } from "./types";
import { getSupabase } from "./cloud";

export type TripRecord = {
  id: string;
  name: string;
  start_date?: string | null;
  day_count: number;
};

export async function listTrips(): Promise<TripRecord[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from("trips")
    .select("id,name,start_date,day_count")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createTrip(name: string): Promise<TripRecord | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("trips")
    .insert({
      user_id: userData.user.id,
      name: name.trim() || "My USA Trip",
      day_count: 3
    })
    .select("id,name,start_date,day_count")
    .single();

  if (error) throw error;
  return data;
}

export async function renameTrip(id: string, name: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase
    .from("trips")
    .update({ name })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTrip(id: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) throw error;
}

export async function createShareLink(tripId: string) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: existing } = await supabase
    .from("trip_shares")
    .select("share_token,is_public")
    .eq("trip_id", tripId)
    .maybeSingle();

  let token = existing?.share_token;

  if (!existing) {
    const { data, error } = await supabase
      .from("trip_shares")
      .insert({ trip_id: tripId, is_public: true })
      .select("share_token")
      .single();
    if (error) throw error;
    token = data.share_token;
  } else if (!existing.is_public) {
    const { error } = await supabase
      .from("trip_shares")
      .update({ is_public: true })
      .eq("trip_id", tripId);
    if (error) throw error;
  }

  if (!token) return null;
  return `${window.location.origin}/share/${token}`;
}

export async function saveTripReminder(tripId: string, remindAt: string, message: string) {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const { error } = await supabase.from("trip_reminders").insert({
    user_id: userData.user.id,
    trip_id: tripId,
    remind_at: remindAt,
    message
  });

  if (error) throw error;
  return true;
}
