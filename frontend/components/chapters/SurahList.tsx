"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Compass, BookOpen, Sun, Moon } from "lucide-react";
import { SurahMetadata } from "@/types";

interface SurahListProps {
  surahs: SurahMetadata[];
}

export default function SurahList({ surahs }: SurahListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "meccan" | "medinan">("all");

  const filteredSurahs = surahs.filter((surah) => {
    const matchesSearch =
      surah.surah_name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.surah_name_ar.includes(searchQuery) ||
      surah.surah.toString() === searchQuery;

    const matchesFilter =
      filterType === "all" ||
      (filterType === "meccan" && surah.revelation_place.toLowerCase() === "meccan") ||
      (filterType === "medinan" && surah.revelation_place.toLowerCase() === "medinan");

    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search by name or number (e.g. Al-Fatihah, 1)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-gray-50 rounded-2xl border border-gray-100/50 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterType("all")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterType === "all"
                ? "bg-white text-emerald-800 shadow-sm border border-gray-100"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <BookOpen size={16} />
            All
          </button>
          <button
            onClick={() => setFilterType("meccan")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterType === "meccan"
                ? "bg-white text-amber-700 shadow-sm border border-gray-100"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Sun size={16} className="text-amber-500" />
            Meccan
          </button>
          <button
            onClick={() => setFilterType("medinan")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterType === "medinan"
                ? "bg-white text-emerald-700 shadow-sm border border-gray-100"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Moon size={16} className="text-teal-500" />
            Medinan
          </button>
        </div>
      </div>

      {/* Grid of Surahs */}
      {filteredSurahs.length === 0 ? (
        <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
          <Compass className="mx-auto text-gray-300 mb-3 animate-pulse" size={40} />
          <p className="text-gray-500 font-medium">No chapters found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSurahs.map((surah) => {
            const isMeccan = surah.revelation_place.toLowerCase() === "meccan";
            return (
              <Link
                key={surah.surah}
                href={`/chapters/${surah.surah}`}
                className="group relative flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl hover:border-emerald-100 hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                {/* Decorative background accent on hover */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50/10 rounded-full blur-xl group-hover:bg-emerald-50/30 transition-all pointer-events-none" />

                <div className="flex items-center gap-4">
                  {/* Surah Number Badge */}
                  <div className="w-10 h-10 rounded-2xl bg-gray-50 group-hover:bg-emerald-50 group-hover:text-emerald-700 text-gray-500 font-bold text-sm flex items-center justify-center border border-gray-100 transition-colors shrink-0">
                    {surah.surah}
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors flex items-center gap-2">
                      {surah.surah_name_en}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {surah.verse_count} Ayahs
                    </p>
                  </div>
                </div>

                {/* Right side - Arabic Name and Place badge */}
                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className="font-arabic text-lg font-bold text-emerald-800/80 group-hover:text-emerald-700 transition-colors">
                    {surah.surah_name_ar}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                      isMeccan
                        ? "bg-amber-50 text-amber-700 border border-amber-100/50"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-100/50"
                    }`}
                  >
                    {isMeccan ? (
                      <>
                        <Sun size={10} className="text-amber-500" />
                        Meccan
                      </>
                    ) : (
                      <>
                        <Moon size={10} className="text-teal-600" />
                        Medinan
                      </>
                    )}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
