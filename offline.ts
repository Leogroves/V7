import { Attraction } from "./types";

const KEY = "usa-attractions-offline-cache-v1";

export function saveOfflineAttractions(items: Attraction[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      savedAt: Date.now(),
      attractions: items
    }));
  } catch {}
}

export function loadOfflineAttractions(): Attraction[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "{}");
    return Array.isArray(parsed.attractions) ? parsed.attractions : [];
  } catch {
    return [];
  }
}
