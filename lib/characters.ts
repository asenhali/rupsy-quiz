/**
 * Character image paths live in /characters/.
 * Use this helper for consistent src across the app.
 */
export function getCharacterSrc(characterId: string): string {
  return `/characters/${characterId || "rupsik"}.png`;
}
