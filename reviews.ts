import { getSupabase } from "./cloud";

export type Review = {
  id: string;
  user_id: string;
  attraction_id: string;
  rating: number;
  review_text?: string | null;
  created_at: string;
};

export async function getReviews(attractionId: string): Promise<Review[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("attraction_reviews")
    .select("*")
    .eq("attraction_id", attractionId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addReview(attractionId: string, rating: number, reviewText: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Sign in first");

  const { error } = await supabase.from("attraction_reviews").insert({
    user_id: userData.user.id,
    attraction_id: attractionId,
    rating,
    review_text: reviewText
  });

  if (error) throw error;
}
