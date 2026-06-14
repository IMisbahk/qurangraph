"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Compass, Sparkles, AlertCircle, ArrowDown, HelpCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import AudioPlayer from "@/components/shared/AudioPlayer";
import { getCommunityColor, formatSimilarity } from "@/lib/utils";
import type { Verse, SurahMetadata, PathResult } from "@/types";

export default function BridgesPage() {
  const [surahs, setSurahs] = useState<SurahMetadata[]>([]);
  const [isLoadingSurahs, setIsLoadingSurahs] = useState(true);

  // Pathfinding State
  const [srcSurah, setSrcSurah] = useState("1");
  const [srcAyah, setSrcAyah] = useState("1");
  const [tgtSurah, setTgtSurah] = useState("2");
  const [tgtAyah, setTgtAyah] = useState("255");

  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [isFindingPath, setIsFindingPath] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load Surah metadata for dropdowns
  useEffect(() => {
    api.getSurahs()
      .then((data) => {
        setSurahs(data);
        setIsLoadingSurahs(false);
      })
      .catch((err) => {
        console.error("Failed to load surahs", err);
        setIsLoadingSurahs(false);
      });
  }, []);

  const handleFindPath = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setPathResult(null);
    setIsFindingPath(true);

    const source = `${srcSurah}:${srcAyah}`;
    const target = `${tgtSurah}:${tgtAyah}`;

    if (source === target) {
      setErrorMsg("Please select two different verses to discover a path.");
      setIsFindingPath(false);
      return;
    }

    try {
      const result = await api.getPath(source, target);
      setPathResult(result);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message?.includes("404")
          ? `No path found between ${source} and ${target}. They belong to disconnected thematic areas.`
          : "An error occurred while finding the path. Please try again."
      );
    } finally {
      setIsFindingPath(false);
    }
  };

  // Helper to generate ayah options for a selected surah
  const getAyahCount = (surahNumStr: string) => {
    const sNum = parseInt(surahNumStr, 10);
    const surah = surahs.find((s) => s.surah === sNum);
    return surah ? surah.verse_count : 7; // default to Fatihah (7)
  };

  // Sync Ayah selection when Surah changes to ensure it's not out of bounds
  useEffect(() => {
    const max = getAyahCount(srcSurah);
    if (parseInt(srcAyah, 10) > max) {
      setSrcAyah("1");
    }
  }, [srcSurah]);

  useEffect(() => {
    const max = getAyahCount(tgtSurah);
    if (parseInt(tgtAyah, 10) > max) {
      setTgtAyah("1");
    }
  }, [tgtSurah]);

  const sourceAyahCount = getAyahCount(srcSurah);
  const targetAyahCount = getAyahCount(tgtSurah);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[calc(100vh-120px)]">
      {/* Title */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
            <Compass size={16} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Quranic Bridges</h1>
        </div>
        <p className="text-gray-500 max-w-2xl">
          Discover how seemingly distant verses in the Quran connect through shared semantic meanings.
          Select two verses below to trace the shortest thematic bridge between them.
        </p>
      </div>

      {/* Selector Panel */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm mb-10">
        {isLoadingSurahs ? (
          <div className="flex items-center justify-center py-6 text-gray-400 gap-2">
            <Loader2 className="animate-spin text-emerald-600" size={20} />
            <span>Loading chapters metadata...</span>
          </div>
        ) : (
          <form onSubmit={handleFindPath} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              {/* FROM Selector */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">From Verse</label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <select
                      value={srcSurah}
                      onChange={(e) => setSrcSurah(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900"
                    >
                      {surahs.map((s) => (
                        <option key={s.surah} value={s.surah}>
                          {s.surah}. {s.surah_name_en}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      value={srcAyah}
                      onChange={(e) => setSrcAyah(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900"
                    >
                      {Array.from({ length: sourceAyahCount }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Ayah {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* TO Selector */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">To Verse</label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <select
                      value={tgtSurah}
                      onChange={(e) => setTgtSurah(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900"
                    >
                      {surahs.map((s) => (
                        <option key={s.surah} value={s.surah}>
                          {s.surah}. {s.surah_name_en}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      value={tgtAyah}
                      onChange={(e) => setTgtAyah(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900"
                    >
                      {Array.from({ length: targetAyahCount }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Ayah {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={isFindingPath}
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm font-bold text-sm flex items-center justify-center gap-2 hover:shadow hover:scale-[1.01] transition-all disabled:opacity-50 disabled:scale-100"
              >
                {isFindingPath ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Finding Paths...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} fill="currentColor" />
                    Discover Bridge
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Error Output */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-5 rounded-2xl bg-amber-50 text-amber-900 border border-amber-100/50 mb-10">
          <AlertCircle className="shrink-0 text-amber-600 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-sm">Connection Unavailable</h4>
            <p className="text-sm mt-1 leading-relaxed text-amber-800">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Path Output */}
      {pathResult && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-xs font-semibold text-emerald-700 mb-2">
              Bridge Discovered
            </span>
            <h2 className="text-xl font-bold text-gray-900">
              {pathResult.length === 1 
                ? "Direct Semantic Connection (1 Step)" 
                : `Connected in ${pathResult.length} steps`}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Tracing transition flow from Surah {pathResult.verses[0].surah_name_en} to Surah {pathResult.verses[pathResult.verses.length - 1].surah_name_en}
            </p>
          </div>

          <div className="relative pl-6 sm:pl-8 border-l border-emerald-100 ml-4 space-y-12">
            {pathResult.verses.map((verse, idx) => {
              const commColor = getCommunityColor(verse.community ?? 0);
              const isLast = idx === pathResult.verses.length - 1;

              return (
                <div key={verse.verse_id} className="relative">
                  {/* Timeline Dot */}
                  <span className="absolute -left-[31px] sm:-left-[39px] top-3.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-emerald-600 bg-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  </span>

                  {/* Verse Card */}
                  <div className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-sm transition-all duration-300">
                    <div className="flex flex-col gap-4">
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <Link 
                            href={`/verse/${encodeURIComponent(verse.verse_id)}`}
                            className="text-sm font-bold text-gray-900 hover:text-emerald-600 transition-colors"
                          >
                            {verse.surah_name_en} {verse.surah}:{verse.ayah}
                          </Link>
                          <AudioPlayer ayahQuran={verse.ayah_quran} size="sm" />
                        </div>
                        
                        {verse.community !== null && (
                          <span 
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white"
                            style={{ backgroundColor: commColor }}
                          >
                            Theme {verse.community}
                          </span>
                        )}
                      </div>

                      {/* Arabic */}
                      <p dir="rtl" className="font-arabic text-xl sm:text-2xl text-emerald-900 text-right select-none leading-loose">
                        {verse.arabic}
                      </p>

                      {/* English */}
                      <p className="text-sm text-gray-600 italic leading-relaxed">
                        {verse.english}
                      </p>
                    </div>
                  </div>

                  {/* Similarity Badge Connector to Next Step */}
                  {!isLast && (
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 pointer-events-none">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-700 shadow-sm flex items-center gap-1">
                        <ArrowDown size={10} className="animate-bounce" />
                        Semantic Transition
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
