"""
QuranGraph Pydantic Models
"""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field


class Verse(BaseModel):
    verse_id: str = Field(..., description="Format: 'surah:ayah', e.g., '1:1'")
    surah: int
    ayah: int
    ayah_quran: int
    english: str
    arabic: str
    revelation_place: str
    surah_name_en: str
    surah_name_ar: str
    community: Optional[int] = None
    degree: Optional[int] = None
    pagerank: Optional[float] = None


class SearchResult(BaseModel):
    verse_id: str
    score: float
    english: str
    arabic: str
    surah: int
    ayah: int
    surah_name_en: str
    revelation_place: str
    community: Optional[int] = None


class GraphNode(BaseModel):
    id: str
    surah: int
    ayah: int
    english: str
    arabic: str
    surah_name_en: str
    community: int
    degree: int
    pagerank: float
    revelation_place: str


class GraphEdge(BaseModel):
    source: str
    target: str
    similarity: float


class GraphData(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    node_count: int
    edge_count: int


class CommunityStats(BaseModel):
    community_id: int
    size: int
    density: float
    avg_similarity: float
    central_verse_id: str
    central_verse_english: str
    representative_verses: list[str]


class StatsResponse(BaseModel):
    verse_count: int
    edge_count: int
    community_count: int
    avg_degree: float
    largest_community_id: int
    largest_community_size: int
    most_connected_verse: str
    most_connected_verse_degree: int


class PathResult(BaseModel):
    path: list[str]
    length: int
    verses: list[Verse]


class NeighborResult(BaseModel):
    verse_id: str
    similarity: float
    english: str
    arabic: str
    surah: int
    ayah: int
    surah_name_en: str
    community: Optional[int] = None


class SurahMetadata(BaseModel):
    surah: int
    surah_name_en: str
    surah_name_ar: str
    revelation_place: str
    verse_count: int

