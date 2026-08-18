import { Attraction } from "./types";
import { milesBetween } from "./geo";

export function recommendAttractions(
  attractions: Attraction[],
  favorites: Set<string>,
  visited: Set<string>,
  bucket: Set<string>,
  location?: { latitude: number; longitude: number } | null
) {
  const liked = attractions.filter(a => favorites.has(a.id) || bucket.has(a.id));
  const preferredCategories = new Map<string, number>();

  liked.forEach(a => {
    preferredCategories.set(
      a.category,
      (preferredCategories.get(a.category) || 0) + 1
    );
  });

  return attractions
    .filter(a => !visited.has(a.id))
    .map(a => {
      let score = preferredCategories.get(a.category) || 0;

      if (favorites.has(a.id)) score += 2;
      if (bucket.has(a.id)) score += 1;

      if (location) {
        const miles = milesBetween(
          location.latitude,
          location.longitude,
          a.latitude,
          a.longitude
        );
        if (miles < 50) score += 4;
        else if (miles < 150) score += 2;
        else if (miles < 300) score += 1;
      }

      return { attraction: a, score };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map(x => x.attraction);
}
