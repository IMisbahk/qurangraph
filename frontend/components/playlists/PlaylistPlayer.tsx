"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Play, Pause, Loader2, Trash2, ArrowUp, ArrowDown, SkipBack, SkipForward, X, Volume2 } from "lucide-react";
import { api } from "@/lib/api";
import { Verse } from "@/types";
import { getCommunityColor } from "@/lib/utils";
import AddToPlaylistButton from "./AddToPlaylistButton";

interface PlaylistPlayerProps {
  playlistName: string;
  verseIds: string[];
  onRemoveVerse: (verseId: string) => void;
}

export default function PlaylistPlayer({ playlistName, verseIds, onRemoveVerse }: PlaylistPlayerProps) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Playback state
  const [activeVerseId, setActiveVerseId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Memorization Mode State
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);
  const [hideTranslation, setHideTranslation] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeVerseRef = useRef<HTMLDivElement | null>(null);
  const isTransitioningRef = useRef(false);
  const playbackRateRef = useRef(1.0);
  const isLoopingRef = useRef(false);

  // Sync refs to make them available in the audio event listener callbacks
  useEffect(() => {
    playbackRateRef.current = playbackRate;
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  // Fetch verse data for all verse IDs
  useEffect(() => {
    if (verseIds.length === 0) {
      setVerses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    Promise.all(verseIds.map((id) => api.getVerse(id)))
      .then((data) => {
        setVerses(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load some verses in this playlist.");
        setLoading(false);
      });
  }, [verseIds]);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleCanPlay = () => {
      setIsLoading(false);
      audio.playbackRate = playbackRateRef.current;
      audio.play().catch((err) => {
        console.error("Playback error", err);
        setIsPlaying(false);
      });
    };

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      isTransitioningRef.current = false;
      setIsLoading(false);
      setIsPlaying(true);
    };

    const handlePause = () => {
      if (isTransitioningRef.current) return;
      setIsPlaying(false);
    };

    const handleEnded = () => {
      if (isLoopingRef.current && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => {
          console.error("Replay error", err);
          setIsPlaying(false);
        });
        return;
      }

      setActiveVerseId((currentId) => {
        if (!currentId) return null;
        const currentIndex = verseIds.indexOf(currentId);
        if (currentIndex !== -1 && currentIndex < verseIds.length - 1) {
          isTransitioningRef.current = true;
          setIsLoading(true);
          return verseIds[currentIndex + 1];
        }
        setIsPlaying(false);
        return null;
      });
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.pause();
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioRef.current = null;
    };
  }, [verseIds]);

  // Sync audio source when activeVerseId changes
  useEffect(() => {
    if (!audioRef.current || !activeVerseId) return;

    const verse = verses.find((v) => v.verse_id === activeVerseId);
    if (!verse) return;

    isTransitioningRef.current = true;
    setIsLoading(true);
    setCurrentTime(0);
    setDuration(0);
    audioRef.current.src = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${verse.ayah_quran}.mp3`;
    audioRef.current.load();

    // Scroll active verse into view smoothly
    if (activeVerseRef.current) {
      activeVerseRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeVerseId, verses]);

  const handlePlayToggle = (verseId: string) => {
    if (!audioRef.current) return;

    if (activeVerseId === verseId) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        audioRef.current.play().catch(() => setIsLoading(false));
      }
    } else {
      isTransitioningRef.current = true;
      setActiveVerseId(verseId);
    }
  };

  const handleStartPlaylist = () => {
    if (verses.length > 0) {
      setActiveVerseId(verses[0].verse_id);
    }
  };

  const activeVerse = verses.find((v) => v.verse_id === activeVerseId);

  const handlePrev = () => {
    if (!activeVerseId) return;
    const idx = verseIds.indexOf(activeVerseId);
    if (idx > 0) {
      isTransitioningRef.current = true;
      setActiveVerseId(verseIds[idx - 1]);
    }
  };

  const handleNext = () => {
    if (!activeVerseId) return;
    const idx = verseIds.indexOf(activeVerseId);
    if (idx < verseIds.length - 1) {
      isTransitioningRef.current = true;
      setActiveVerseId(verseIds[idx + 1]);
    }
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setActiveVerseId(null);
    setIsPlaying(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = parseFloat(e.target.value);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = pct * audioRef.current.duration;
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
        <Loader2 className="animate-spin text-emerald-600" size={20} />
        <span>Loading playlist verses...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (verses.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <Volume2 className="mx-auto text-gray-300 mb-3 animate-pulse" size={32} />
        <p className="text-gray-500 font-medium">This playlist is empty.</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
          Go to Chapters or search results and use the add button next to any verse to save them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Custom Queue</span>
          <h2 className="text-xl font-extrabold text-gray-900">{playlistName}</h2>
        </div>
        <button
          onClick={handleStartPlaylist}
          className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-emerald-500/10 hover:shadow"
        >
          <Play size={13} fill="currentColor" />
          Play Sequence
        </button>
      </div>

      {/* Verses List */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm divide-y divide-gray-100">
        {verses.map((verse, idx) => {
          const isActive = verse.verse_id === activeVerseId;
          const commColor = getCommunityColor(verse.community ?? 0);

          return (
            <div
              key={verse.verse_id}
              ref={isActive ? activeVerseRef : null}
              className={`flex flex-col gap-3.5 p-5 transition-all duration-300 border-l-4 ${
                isActive 
                  ? "bg-emerald-50/50 border-l-emerald-600 shadow-inner" 
                  : "border-l-transparent hover:bg-gray-50/50"
              }`}
            >
              {/* Row Header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center border transition-colors ${
                    isActive 
                      ? "bg-emerald-600 text-white border-emerald-600" 
                      : "bg-gray-50 text-gray-500 border-gray-100"
                  }`}>
                    {idx + 1}
                  </span>

                  <button
                    onClick={() => handlePlayToggle(verse.verse_id)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
                      isActive && isPlaying
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-100/50"
                    }`}
                  >
                    {isActive && isLoading ? (
                      <Loader2 size={12} className="animate-spin text-emerald-600" />
                    ) : isActive && isPlaying ? (
                      <Pause size={12} fill="currentColor" />
                    ) : (
                      <Play size={12} className="ml-0.5" fill="currentColor" />
                    )}
                  </button>

                  <span className="text-xs font-bold text-gray-900">
                    {verse.surah_name_en} {verse.surah}:{verse.ayah}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {verse.community !== null && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[9px] font-semibold text-white"
                      style={{ backgroundColor: commColor }}
                    >
                      Theme {verse.community}
                    </span>
                  )}
                  <button
                    onClick={() => onRemoveVerse(verse.verse_id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                    title="Remove from playlist"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Arabic Calligraphy */}
              <p
                dir="rtl"
                lang="ar"
                className="font-arabic text-xl sm:text-2xl text-gray-900 leading-relaxed text-right select-none"
              >
                {verse.arabic}
              </p>

              {/* English Translation */}
              {!hideTranslation && (
                <p className="text-gray-500 text-sm leading-relaxed italic animate-fade-in">
                  {verse.english}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Audio Player */}
      {activeVerse && (
        <div className="fixed bottom-6 left-1/2 w-[calc(100%-2rem)] max-w-xl bg-slate-950/95 backdrop-blur-md text-white border border-slate-800 rounded-3xl p-4 shadow-2xl z-50 animate-slide-up flex flex-col gap-3">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes slide-up {
              from { transform: translateY(100%) translateX(-50%); opacity: 0; }
              to { transform: translateY(0) translateX(-50%); opacity: 1; }
            }
            .animate-slide-up {
              animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}} />

          {/* Top Row: Info & Controls */}
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 select-none text-white shadow-sm shadow-emerald-500/20">
                {verseIds.indexOf(activeVerse.verse_id) + 1}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-emerald-400 truncate flex items-center gap-1.5">
                  {activeVerse.surah_name_en}
                  <span className="text-[10px] text-gray-500 font-mono">({activeVerse.surah}:{activeVerse.ayah})</span>
                </h4>
                {!hideTranslation && (
                  <p className="text-[11px] text-gray-400 truncate italic select-none mt-0.5 animate-fade-in">
                    &ldquo;{activeVerse.english}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* Prev */}
                <button
                  onClick={handlePrev}
                  disabled={verseIds.indexOf(activeVerseId!) === 0}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 active:scale-95 disabled:opacity-35 disabled:scale-100 transition-all"
                  title="Previous Verse"
                >
                  <SkipBack size={16} fill="currentColor" />
                </button>

                {/* Play/Pause */}
                <button
                  onClick={() => handlePlayToggle(activeVerse.verse_id)}
                  disabled={isLoading}
                  className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 text-slate-950 flex items-center justify-center active:scale-95 transition-all shadow-md shrink-0"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin text-emerald-600" />
                  ) : isPlaying ? (
                    <Pause size={16} fill="currentColor" className="text-slate-900" />
                  ) : (
                    <Play size={16} fill="currentColor" className="text-slate-900 ml-0.5" />
                  )}
                </button>

                {/* Next */}
                <button
                  onClick={handleNext}
                  disabled={verseIds.indexOf(activeVerseId!) === verseIds.length - 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 active:scale-95 disabled:opacity-35 disabled:scale-100 transition-all"
                  title="Next Verse"
                >
                  <SkipForward size={16} fill="currentColor" />
                </button>
              </div>

              {/* Close */}
              <div className="border-l border-slate-800 pl-3">
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                  title="Close Player"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Middle Row: Speed, Loop, Hide Translation */}
          <div className="flex items-center justify-between border-t border-slate-900/50 pt-2.5 px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none">Speed</span>
              <select
                value={playbackRate}
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-lg text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-300 font-semibold cursor-pointer"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1.0}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2.0}>2.0x</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  isLooping
                    ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30"
                    : "bg-slate-900 border-slate-800 text-gray-400 hover:text-gray-200"
                }`}
                title="Loop current verse"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3" />
                </svg>
                Loop
              </button>

              <button
                onClick={() => setHideTranslation(!hideTranslation)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  hideTranslation
                    ? "bg-amber-600/20 text-amber-400 border-amber-500/30"
                    : "bg-slate-900 border-slate-800 text-gray-400 hover:text-gray-200"
                }`}
                title="Hide English translation for memorization"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {hideTranslation ? "Show English" : "Hide English"}
              </button>
            </div>
          </div>

          {/* Bottom Row: Seek Slider */}
          <div className="flex items-center gap-3 w-full border-t border-slate-900/50 pt-2.5 px-1">
            <span className="text-[10px] text-gray-400 font-mono select-none w-10 text-left shrink-0">
              {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, "0")}
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={duration > 0 ? currentTime / duration : 0}
              onChange={handleSeek}
              className="flex-grow h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
            />
            <span className="text-[10px] text-gray-400 font-mono select-none w-10 text-right shrink-0">
              {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
