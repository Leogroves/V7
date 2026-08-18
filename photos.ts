import { getSupabase } from "./cloud";

export async function uploadAttractionPhoto(
  attractionId: string,
  file: File,
  caption = ""
) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Cloud storage is not configured.");

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Sign in to upload photos.");

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${attractionId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("attraction-photos")
    .upload(path, file, { upsert: false });

  if (uploadError) throw uploadError;

  const { data: publicData } = supabase.storage
    .from("attraction-photos")
    .getPublicUrl(path);

  const imageUrl = publicData.publicUrl;

  const { error } = await supabase.from("attraction_photos").insert({
    user_id: user.id,
    attraction_id: attractionId,
    image_url: imageUrl,
    caption
  });

  if (error) throw error;
  return imageUrl;
}

export async function getAttractionPhotos(attractionId: string) {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("attraction_photos")
    .select("id,image_url,caption,created_at")
    .eq("attraction_id", attractionId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
