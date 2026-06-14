"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, AlertCircle, Loader2 } from "lucide-react";

interface AudioPlayerProps {
  ayahQuran: number;
  verseId?: string;
  size?: "sm" | "md" | "lg";
}

export default function AudioPlayer({ ayahQuran, verseId, size = "md" }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayahQuran}.mp3`;

  // Handle cleanup on unmount or when ayah changes
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [ayahQuran]);

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasError) return;

    if (!audioRef.current) {
      setIsLoading(true);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener("canplaythrough", () => {
        setIsLoading(false);
        audio.play().then(() => setIsPlaying(true)).catch(() => {
          setHasError(true);
          setIsLoading(false);
        });
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
      });

      audio.addEventListener("error", () => {
        setHasError(true);
        setIsLoading(false);
        setIsPlaying(false);
      });

      // Start loading
      audio.load();
    } else {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        audioRef.current.play()
          .then(() => {
            setIsLoading(false);
            setIsPlaying(true);
          })
          .catch(() => {
            setHasError(true);
            setIsLoading(false);
          });
      }
    }
  };

  // Dimensions based on size prop
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center rounded-full bg-red-50 text-red-500 border border-red-100 ${sizeClasses[size]}`}
        title="Failed to load recitation"
      >
        <AlertCircle size={iconSizes[size]} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className={`flex items-center justify-center rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 transition-all border border-emerald-100/50 shadow-sm hover:scale-105 active:scale-95 ${sizeClasses[size]} ${
          isPlaying ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600" : ""
        }`}
        title={isPlaying ? "Pause recitation" : "Play recitation (Mishary Alafasy)"}
      >
        {isLoading ? (
          <Loader2 size={iconSizes[size]} className="animate-spin text-emerald-600" />
        ) : isPlaying ? (
          <Pause size={iconSizes[size]} fill="currentColor" />
        ) : (
          <Play size={iconSizes[size]} className="ml-0.5" fill="currentColor" />
        )}
      </button>

      {isPlaying && (
        <div className="flex items-end gap-[2px] h-3 px-1">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes eq-bounce {
              0%, 100% { transform: scaleY(0.3); }
              50% { transform: scaleY(1); }
            }
            .eq-bar {
              width: 2px;
              background-color: #059669;
              transform-origin: bottom;
            }
            .eq-bar-1 { animation: eq-bounce 0.8s ease-in-out infinite; }
            .eq-bar-2 { animation: eq-bounce 0.5s ease-in-out infinite 0.15s; }
            .eq-bar-3 { animation: eq-bounce 0.7s ease-in-out infinite 0.3s; }
          `}} />
          <div className="eq-bar eq-bar-1 h-3 rounded-full" />
          <div className="eq-bar eq-bar-2 h-3 rounded-full" />
          <div className="eq-bar eq-bar-3 h-3 rounded-full" />
        </div>
      )}
    </div>
  );
}
