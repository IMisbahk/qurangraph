"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Pause, Loader2, Sparkles, Sun, Moon, SkipBack, SkipForward, X } from "lucide-react";
import { Verse } from "@/types";
import { getCommunityColor } from "@/lib/utils";

interface SurahDetailProps {
  verses: Verse[];
  surahId: number;
  autoplay?: boolean;
}

export default function SurahDetail({ verses, surahId, autoplay = false }: SurahDetailProps) {
  const router = useRouter();
  const [activeVerseId, setActiveVerseId] = useState<string | null>(
    autoplay && verses.length > 0 ? verses[0].verse_id : null
  );
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isLoading, setIsLoading] = useState(autoplay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeVerseRef = useRef<HTMLDivElement | null>(null);
  const targetSeekPctRef = useRef(0);
  const isTransitioningRef = useRef(false);

  const firstVerse = verses[0];
  const isMeccan = firstVerse.revelation_place.toLowerCase() === "meccan";

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleCanPlay = () => {
      setIsLoading(false);
      if (targetSeekPctRef.current > 0 && audio.duration) {
        audio.currentTime = targetSeekPctRef.current * audio.duration;
        targetSeekPctRef.current = 0;
      }
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
      setActiveVerseId((currentId) => {
        if (!currentId) return null;
        const currentIndex = verses.findIndex((v) => v.verse_id === currentId);
        if (currentIndex !== -1) {
          if (currentIndex < verses.length - 1) {
            isTransitioningRef.current = true;
            setIsLoading(true);
            const nextVerse = verses[currentIndex + 1];
            return nextVerse.verse_id;
          } else {
            // Surah finished! Go to next Surah
            setIsPlaying(false);
            handleSurahCompleted();
            return null;
          }
        }
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
  }, [verses, surahId]);

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

    // Scroll active verse into view smoothly if not already visible
    if (activeVerseRef.current) {
      const rect = activeVerseRef.current.getBoundingClientRect();
      const isInViewport = (
        rect.top >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
      );
      if (!isInViewport) {
        activeVerseRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
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

  const activeVerse = verses.find((v) => v.verse_id === activeVerseId);

  const handlePrev = () => {
    if (!activeVerseId) return;
    const idx = verses.findIndex((v) => v.verse_id === activeVerseId);
    if (idx > 0) {
      isTransitioningRef.current = true;
      setActiveVerseId(verses[idx - 1].verse_id);
    }
  };

  const handleNext = () => {
    if (!activeVerseId) return;
    const idx = verses.findIndex((v) => v.verse_id === activeVerseId);
    if (idx < verses.length - 1) {
      isTransitioningRef.current = true;
      setActiveVerseId(verses[idx + 1].verse_id);
    }
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setActiveVerseId(null);
    setIsPlaying(false);
  };

  const handleSurahSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setDragValue(val);
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleSurahSeekEnd = (e: React.MouseEvent | React.TouchEvent | React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    setIsDragging(false);
    
    const targetIdx = Math.floor(val);
    const pct = val - targetIdx;
    
    if (targetIdx >= verses.length) {
      handleSurahCompleted();
      return;
    }

    const targetVerse = verses[targetIdx];
    
    if (activeVerseId === targetVerse.verse_id) {
      if (audioRef.current && audioRef.current.duration) {
        audioRef.current.currentTime = pct * audioRef.current.duration;
        setCurrentTime(audioRef.current.currentTime);
      }
    } else {
      isTransitioningRef.current = true;
      targetSeekPctRef.current = pct;
      setActiveVerseId(targetVerse.verse_id);
    }
  };

  const handleSurahCompleted = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setActiveVerseId(null);
    
    if (surahId < 114) {
      router.push(`/chapters/${surahId + 1}?autoplay=true`);
    } else {
      router.push("/chapters");
    }
  };

  const currentIndex = activeVerseId ? verses.findIndex((v) => v.verse_id === activeVerseId) : 0;
  const currentProgress = isDragging ? dragValue : currentIndex + (duration > 0 ? currentTime / duration : 0);
  
  const currentVerseIndex = Math.max(
    0,
    Math.min(
      Math.floor(isNaN(currentProgress) ? 0 : currentProgress),
      verses.length - 1
    )
  );
  const displayAyah = verses[currentVerseIndex]?.ayah || 1;


  return (
    <div>
      {/* Surah Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 to-teal-950 text-white rounded-3xl p-8 sm:p-10 shadow-md mb-10 border border-emerald-700/30">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <svg className="w-40 h-40 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L22 12L12 22L2 12L12 2Z" />
          </svg>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/10 backdrop-blur-sm text-emerald-200 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase border border-white/5">
                Surah {firstVerse.surah}
              </span>
              <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase border ${
                isMeccan 
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/20" 
                  : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
              }`}>
                {isMeccan ? "Meccan" : "Medinan"}
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-1">{firstVerse.surah_name_en}</h1>
            <p className="text-emerald-100/70 text-sm">
              Revealed in {isMeccan ? "Makkah" : "Madinah"} · Contains {verses.length} verses
            </p>
          </div>

          <div className="text-right shrink-0 flex flex-col items-start sm:items-end">
            <span className="font-arabic text-4xl font-bold text-emerald-100 select-none" dir="rtl">
              {firstVerse.surah_name_ar}
            </span>
          </div>
        </div>
      </div>

      {/* Bismillah */}
      {surahId !== 9 && surahId !== 1 && (
        <div className="text-center font-arabic text-3xl text-emerald-800/80 mb-12 select-none animate-fade-in" dir="rtl">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
      )}

      {/* Compact Verses List */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm divide-y divide-gray-100">
        {verses.map((v) => {
          const isActive = v.verse_id === activeVerseId;
          const commColor = getCommunityColor(v.community ?? 0);

          return (
            <div
              key={v.verse_id}
              ref={isActive ? activeVerseRef : null}
              className={`flex flex-col gap-3.5 p-5 sm:p-6 transition-all duration-300 border-l-4 ${
                isActive 
                  ? "bg-emerald-50/50 border-l-emerald-600 shadow-inner" 
                  : "border-l-transparent hover:bg-gray-50/50"
              }`}
            >
              {/* Row Header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* Verse Number Badge */}
                  <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center border transition-colors ${
                    isActive 
                      ? "bg-emerald-600 text-white border-emerald-600" 
                      : "bg-gray-50 text-gray-500 border-gray-100"
                  }`}>
                    {v.ayah}
                  </span>

                  {/* Play Button */}
                  <button
                    onClick={() => handlePlayToggle(v.verse_id)}
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

                  {/* Equalizer animation for active playing row */}
                  {isActive && isPlaying && (
                    <div className="flex items-end gap-[2px] h-3 px-1">
                      <style dangerouslySetInnerHTML={{__html: `
                        @keyframes eq-bounce-small {
                          0%, 100% { transform: scaleY(0.3); }
                          50% { transform: scaleY(1); }
                        }
                        .eq-bar-s {
                          width: 2px;
                          background-color: #059669;
                          transform-origin: bottom;
                        }
                        .eq-bar-s1 { animation: eq-bounce-small 0.8s ease-in-out infinite; }
                        .eq-bar-s2 { animation: eq-bounce-small 0.5s ease-in-out infinite 0.15s; }
                        .eq-bar-s3 { animation: eq-bounce-small 0.7s ease-in-out infinite 0.3s; }
                      `}} />
                      <div className="eq-bar-s eq-bar-s1 h-3 rounded-full" />
                      <div className="eq-bar-s eq-bar-s2 h-3 rounded-full" />
                      <div className="eq-bar-s eq-bar-s3 h-3 rounded-full" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {v.community !== null && (
                    <Link
                      href={`/community/${v.community}`}
                      className="px-2 py-0.5 rounded-full text-[9px] font-semibold text-white transition-opacity hover:opacity-85"
                      style={{ backgroundColor: commColor }}
                    >
                      Theme {v.community}
                    </Link>
                  )}
                  <Link
                    href={`/verse/${encodeURIComponent(v.verse_id)}`}
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold text-gray-400 hover:text-emerald-600 transition-colors"
                  >
                    Connections
                    <Sparkles size={11} className="ml-0.5" />
                  </Link>
                </div>
              </div>

              {/* Arabic Calligraphy (Smaller, closer spacing) */}
              <p
                dir="rtl"
                lang="ar"
                className="font-arabic text-xl sm:text-2xl text-gray-900 leading-relaxed text-right select-none"
              >
                {v.ayah === 1 && surahId !== 1 && surahId !== 9 && v.arabic.startsWith("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ")
                  ? v.arabic.replace("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "").trim()
                  : v.arabic}
              </p>

              {/* English Translation */}
              <p className="text-gray-500 text-sm leading-relaxed italic">
                {v.english}
              </p>
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
            {/* Left: Verse Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 select-none text-white shadow-sm shadow-emerald-500/20">
                {activeVerse.ayah}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-emerald-400 truncate flex items-center gap-1.5">
                  {activeVerse.surah_name_en}
                  <span className="text-[10px] text-gray-500 font-mono">({activeVerse.surah}:{activeVerse.ayah})</span>
                </h4>
                <p className="text-[11px] text-gray-400 truncate italic select-none mt-0.5">
                  &ldquo;{activeVerse.english}&rdquo;
                </p>
              </div>
            </div>

            {/* Center: Controls & Right Close button */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* Prev */}
                <button
                  onClick={handlePrev}
                  disabled={verses.findIndex((v) => v.verse_id === activeVerseId) === 0}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 active:scale-95 disabled:opacity-35 disabled:scale-100 transition-all"
                  title="Previous Ayah"
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
                  disabled={verses.findIndex((v) => v.verse_id === activeVerseId) === verses.length - 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 active:scale-95 disabled:opacity-35 disabled:scale-100 transition-all"
                  title="Next Ayah"
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

          {/* Bottom Row: Surah Seek Slider */}
          <div className="flex items-center gap-3 w-full border-t border-slate-900/50 pt-2.5 px-1">
            <span className="text-[10px] text-gray-400 font-mono select-none w-18 text-left shrink-0">
              Ayah {displayAyah} / {verses.length}
            </span>
            <input
              type="range"
              min={0}
              max={verses.length}
              step={0.01}
              value={currentProgress}
              onChange={handleSurahSeek}
              onMouseUp={handleSurahSeekEnd}
              onTouchEnd={handleSurahSeekEnd}
              className="flex-grow h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
            />
            <span className="text-[10px] text-gray-400 font-mono select-none w-10 text-right shrink-0">
              {Math.round((currentProgress / verses.length) * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
