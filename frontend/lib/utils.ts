// Utility functions for QuranGraph frontend

/**
 * Generate a deterministic color from a community ID.
 * Uses a carefully selected palette of 20 high-contrast colors.
 */
const COMMUNITY_PALETTE = [
  "#e63946", "#457b9d", "#2a9d8f", "#e9c46a", "#f4a261",
  "#264653", "#6a4c93", "#1982c4", "#8ac926", "#ff595e",
  "#6a994e", "#a7c957", "#bc6c25", "#606c38", "#283618",
  "#ffb703", "#023047", "#219ebc", "#8ecae6", "#d62828",
];

export function getCommunityColor(communityId: number): string {
  return COMMUNITY_PALETTE[communityId % COMMUNITY_PALETTE.length];
}

/**
 * Format a verse ID for display.
 */
export function formatVerseId(verseId: string): string {
  const [surah, ayah] = verseId.split(":");
  return `${surah}:${ayah}`;
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Format similarity score as percentage.
 */
export function formatSimilarity(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Convert node degree to a visual radius.
 */
export function degreeToRadius(degree: number, minR = 3, maxR = 12): number {
  const clamped = Math.max(0, Math.min(degree, 50));
  return minR + (clamped / 50) * (maxR - minR);
}

/**
 * Get surah name from number (fallback label).
 */
export function getVerseLabel(surah: number, ayah: number, surahName: string): string {
  return `${surahName || `Surah ${surah}`} ${surah}:${ayah}`;
}
