"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/types";
import { api } from "@/lib/api";
import { formatVerseId } from "@/lib/utils";

const DEBOUNCE_MS = 400;

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.search(q, 8);
      setResults(data);
      setOpen(true);
    } catch {
      setError("Search unavailable. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), DEBOUNCE_MS);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
    if (e.key === "Enter" && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  };

  const handleSelect = (verseId: string) => {
    router.push(`/verse/${encodeURIComponent(verseId)}`);
    setOpen(false);
    setQuery("");
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-searchbar]")) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative w-full max-w-2xl" data-searchbar="">
      <div className="relative flex items-center">
        <svg
          className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
        <input
          ref={inputRef}
          id="main-search"
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search concepts, themes, or questions..."
          className="w-full pl-12 pr-4 py-4 text-base bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all shadow-sm"
          aria-label="Semantic search"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={open}
        />
        {loading && (
          <div className="absolute right-4 w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {open && results.length > 0 && (
        <div
          id="search-results"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-gray-100"
        >
          {results.map((r) => (
            <button
              key={r.verse_id}
              role="option"
              onClick={() => handleSelect(r.verse_id)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {r.english}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {r.surah_name_en} · {formatVerseId(r.verse_id)}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-mono text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                  {Math.round(r.score * 100)}%
                </span>
              </div>
            </button>
          ))}
          <button
            onClick={() => {
              router.push(`/search?q=${encodeURIComponent(query.trim())}`);
              setOpen(false);
            }}
            className="w-full text-left px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            See all results for &ldquo;{query}&rdquo;
          </button>
        </div>
      )}

      {open && query.trim().length >= 3 && results.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 px-4 py-6 text-center">
          <p className="text-sm text-gray-500">No results found for &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
