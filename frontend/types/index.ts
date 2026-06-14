export interface Verse {
  verse_id: string;
  surah: number;
  ayah: number;
  ayah_quran: number;
  english: string;
  arabic: string;
  revelation_place: string;
  surah_name_en: string;
  surah_name_ar: string;
  community: number | null;
  degree: number | null;
  pagerank: number | null;
}

export interface SearchResult {
  verse_id: string;
  score: number;
  english: string;
  arabic: string;
  surah: number;
  ayah: number;
  surah_name_en: string;
  revelation_place: string;
  community: number | null;
}

export interface GraphNode {
  id: string;
  surah: number;
  ayah: number;
  english: string;
  arabic: string;
  surah_name_en: string;
  community: number;
  degree: number;
  pagerank: number;
  revelation_place: string;
  // react-force-graph adds these at runtime
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

export interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  similarity: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  node_count: number;
  edge_count: number;
}

export interface CommunityStats {
  community_id: number;
  size: number;
  density: number;
  avg_similarity: number;
  central_verse_id: string;
  central_verse_english: string;
  representative_verses: string[];
  theme_name?: string;
}

export interface StatsResponse {
  verse_count: number;
  edge_count: number;
  community_count: number;
  avg_degree: number;
  largest_community_id: number;
  largest_community_size: number;
  most_connected_verse: string;
  most_connected_verse_degree: number;
}

export interface NeighborResult {
  verse_id: string;
  similarity: number;
  english: string;
  arabic: string;
  surah: number;
  ayah: number;
  surah_name_en: string;
  community: number | null;
}

export interface PathResult {
  path: string[];
  length: number;
  verses: Verse[];
}

export interface SurahMetadata {
  surah: number;
  surah_name_en: string;
  surah_name_ar: string;
  revelation_place: string;
  verse_count: number;
}

