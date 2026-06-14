"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, ListPlus, Check, FolderPlus, FolderOpen } from "lucide-react";
import { getPlaylists, createPlaylist, addVerseToPlaylist, removeVerseFromPlaylist, Playlist } from "@/lib/playlistStore";

interface AddToPlaylistButtonProps {
  verseId: string;
}

export default function AddToPlaylistButton({ verseId }: AddToPlaylistButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreateInput, setShowCreateInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPlaylists(getPlaylists());
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateInput(false);
        setNewPlaylistName("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTogglePlaylist = (playlistName: string, isAdded: boolean) => {
    if (isAdded) {
      const updated = removeVerseFromPlaylist(playlistName, verseId);
      setPlaylists(updated);
    } else {
      const updated = addVerseToPlaylist(playlistName, verseId);
      setPlaylists(updated);
    }
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPlaylistName.trim();
    if (!trimmed) return;
    const updated = createPlaylist(trimmed);
    // Automatically add the verse to the newly created playlist
    const final = addVerseToPlaylist(trimmed, verseId);
    setPlaylists(final);
    setNewPlaylistName("");
    setShowCreateInput(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
          isOpen
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-gray-50 hover:bg-gray-100 text-gray-500 border-gray-100/50 hover:text-gray-900"
        }`}
        title="Add to custom playlist"
      >
        <ListPlus size={14} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-40 p-2.5 animate-in fade-in slide-in-from-top-2 duration-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-2 mb-2">
            Save to Playlist
          </p>

          <div className="space-y-0.5 max-h-36 overflow-y-auto mb-2 pr-1">
            {playlists.length === 0 ? (
              <p className="text-[11px] text-gray-400 px-2 py-1.5 italic">
                No playlists created yet.
              </p>
            ) : (
              playlists.map((playlist) => {
                const isAdded = playlist.verseIds.includes(verseId);
                return (
                  <button
                    key={playlist.name}
                    onClick={() => handleTogglePlaylist(playlist.name, isAdded)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-lg text-left transition-colors"
                  >
                    <span className="truncate pr-2">{playlist.name}</span>
                    {isAdded ? (
                      <Check size={14} className="text-emerald-600 shrink-0" />
                    ) : (
                      <Plus size={12} className="text-gray-300 hover:text-gray-600 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-gray-100 pt-2">
            {!showCreateInput ? (
              <button
                onClick={() => setShowCreateInput(true)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/50 rounded-lg text-left transition-colors"
              >
                <FolderPlus size={14} />
                Create New Playlist
              </button>
            ) : (
              <form onSubmit={handleCreatePlaylist} className="flex gap-1.5 px-1">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name..."
                  autoFocus
                  className="flex-grow text-xs px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-900"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2 py-1 text-xs font-bold shrink-0 transition-colors"
                >
                  Create
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
