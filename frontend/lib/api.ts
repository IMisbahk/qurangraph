import type {
  Verse,
  SearchResult,
  GraphData,
  CommunityStats,
  StatsResponse,
  NeighborResult,
  PathResult,
  SurahMetadata,
} from "@/types";

const isServer = typeof window === "undefined";
const API_BASE = isServer
  ? (process.env.BACKEND_URL || "http://localhost:8000")
  : (process.env.NEXT_PUBLIC_API_URL || "/api/backend");

async function fetchJson<T>(path: string, timeoutMs = 5000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
      signal: controller.signal,
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`API error ${res.status}: ${error}`);
    }
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  search: (query: string, limit = 10): Promise<SearchResult[]> =>
    fetchJson<SearchResult[]>(
      `/search?q=${encodeURIComponent(query)}&limit=${limit}`
    ),

  getVerse: (verseId: string): Promise<Verse> =>
    fetchJson<Verse>(`/verse/${encodeURIComponent(verseId)}`),

  getNeighbors: (verseId: string, limit = 10): Promise<NeighborResult[]> =>
    fetchJson<NeighborResult[]>(
      `/neighbors/${encodeURIComponent(verseId)}?limit=${limit}`
    ),

  getGraph: (): Promise<GraphData> => fetchJson<GraphData>("/graph"),

  getCommunities: (): Promise<CommunityStats[]> =>
    fetchJson<CommunityStats[]>("/communities"),

  getCommunity: (
    id: number
  ): Promise<{ stats: CommunityStats; verses: Verse[] }> =>
    fetchJson(`/community/${id}`),

  getStats: (): Promise<StatsResponse> => fetchJson<StatsResponse>("/stats"),

  getPath: (source: string, target: string): Promise<PathResult> =>
    fetchJson<PathResult>(
      `/path?source=${encodeURIComponent(source)}&target=${encodeURIComponent(target)}`
    ),

  getSurahs: (): Promise<SurahMetadata[]> =>
    fetchJson<SurahMetadata[]>("/surahs"),

  getVerseOfTheDay: (): Promise<Verse> =>
    fetchJson<Verse>("/verse/day"),

  getSurahVerses: (surahId: number): Promise<Verse[]> =>
    fetchJson<Verse[]>(`/surah/${surahId}`),
};

