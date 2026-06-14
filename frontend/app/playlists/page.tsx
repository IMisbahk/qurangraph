"use client";

import React, { useState, useEffect } from "react";
import { Folder, FolderPlus, Trash2, Volume2, Plus, Bookmark, FolderOpen } from "lucide-react";
import { getPlaylists, createPlaylist, deletePlaylist, removeVerseFromPlaylist, Playlist } from "@/lib/playlistStore";
import PlaylistPlayer from "@/components/playlists/PlaylistPlayer";

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistName, setSelectedPlaylistName] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const lists = getPlaylists();
    setPlaylists(lists);
    if (lists.length > 0) {
      setSelectedPlaylistName(lists[0].name);
    }
  }, []);

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPlaylistName.trim();
    if (!name) return;
    const updated = createPlaylist(name);
    setPlaylists(updated);
    setSelectedPlaylistName(name);
    setNewPlaylistName("");
    setShowCreateForm(false);
  };

  const handleDeletePlaylist = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the playlist "${name}"?`)) {
      const updated = deletePlaylist(name);
      setPlaylists(updated);
      if (selectedPlaylistName === name) {
        setSelectedPlaylistName(updated.length > 0 ? updated[0].name : null);
      }
    }
  };

  const handleRemoveVerse = (verseId: string) => {
    if (!selectedPlaylistName) return;
    const updated = removeVerseFromPlaylist(selectedPlaylistName, verseId);
    setPlaylists(updated);
  };

  const selectedPlaylist = playlists.find((p) => p.name === selectedPlaylistName);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[calc(100vh-120px)]">
      {/* Title */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
            <Bookmark size={16} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Custom Playlists</h1>
        </div>
        <p className="text-gray-500 max-w-2xl">
          Build curated collections of verses from across the Quran. Group them semantically by topic or difficulty, adjust speeds, loop recitations, and hide translations to help with study and memorization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Side: Playlists List */}
        <div className="space-y-4 md:col-span-1">
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm tracking-wide uppercase">Your Playlists</h3>
              {!showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-all border border-emerald-100/30"
                  title="New playlist"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>

            {/* Create form */}
            {showCreateForm && (
              <form onSubmit={handleCreatePlaylist} className="space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-100">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name..."
                  autoFocus
                  required
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowCreateForm(false); setNewPlaylistName(""); }}
                    className="px-2.5 py-1 text-[11px] font-bold text-gray-500 hover:bg-gray-50 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* Playlists Menu */}
            <div className="space-y-1">
              {playlists.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">No playlists created yet.</p>
              ) : (
                playlists.map((p) => {
                  const isSelected = p.name === selectedPlaylistName;
                  return (
                    <button
                      key={p.name}
                      onClick={() => setSelectedPlaylistName(p.name)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all border ${
                        isSelected
                          ? "bg-emerald-50/50 border-emerald-100 text-emerald-950 font-bold"
                          : "bg-transparent border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-950"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Folder size={14} className={isSelected ? "text-emerald-600" : "text-gray-400"} />
                        <span className="truncate pr-1">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">
                          {p.verseIds.length}
                        </span>
                        <span
                          onClick={(e) => handleDeletePlaylist(e, p.name)}
                          className="w-6 h-6 rounded-md hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors text-gray-400"
                          title="Delete playlist"
                        >
                          <Trash2 size={12} />
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Playlist Player Detail */}
        <div className="md:col-span-2">
          {selectedPlaylist ? (
            <PlaylistPlayer
              playlistName={selectedPlaylist.name}
              verseIds={selectedPlaylist.verseIds}
              onRemoveVerse={handleRemoveVerse}
            />
          ) : (
            <div className="text-center py-24 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <FolderOpen className="mx-auto text-gray-300 mb-3 animate-pulse" size={40} />
              <p className="text-gray-500 font-medium">No playlist selected</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                Create a new playlist on the left panel or save a verse from a Surah detail card to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
