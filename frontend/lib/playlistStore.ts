"use client";

export interface Playlist {
  name: string;
  verseIds: string[];
}

const STORAGE_KEY = "qurangraph_playlists";

export function getPlaylists(): Playlist[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to read playlists", e);
    return [];
  }
}

export function savePlaylists(playlists: Playlist[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
  } catch (e) {
    console.error("Failed to save playlists", e);
  }
}

export function createPlaylist(name: string): Playlist[] {
  const playlists = getPlaylists();
  const trimmed = name.trim();
  if (!trimmed) return playlists;
  if (playlists.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
    return playlists; // Avoid duplicates
  }
  const updated = [...playlists, { name: trimmed, verseIds: [] }];
  savePlaylists(updated);
  return updated;
}

export function deletePlaylist(name: string): Playlist[] {
  const playlists = getPlaylists();
  const updated = playlists.filter((p) => p.name !== name);
  savePlaylists(updated);
  return updated;
}

export function addVerseToPlaylist(playlistName: string, verseId: string): Playlist[] {
  const playlists = getPlaylists();
  const updated = playlists.map((p) => {
    if (p.name === playlistName) {
      if (p.verseIds.includes(verseId)) return p;
      return { ...p, verseIds: [...p.verseIds, verseId] };
    }
    return p;
  });
  savePlaylists(updated);
  return updated;
}

export function removeVerseFromPlaylist(playlistName: string, verseId: string): Playlist[] {
  const playlists = getPlaylists();
  const updated = playlists.map((p) => {
    if (p.name === playlistName) {
      return { ...p, verseIds: p.verseIds.filter((id) => id !== verseId) };
    }
    return p;
  });
  savePlaylists(updated);
  return updated;
}
