"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { SearchResult } from "@/types";
import { getCommunityColor, formatVerseId, formatSimilarity } from "@/lib/utils";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const data = await api.search(q, 20);
      setResults(data);
    } catch {
      setError("Search failed. Is the backend running?");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      runSearch(initialQuery);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputValue.trim();
    if (!q) return;
    setQuery(q);
    router.replace(`/search?q=${encodeURIComponent(q)}`, { scroll: false });
    runSearch(q);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Semantic Search</h1>
      <p className="text-gray-500 mb-8">
        Ask any question or describe a concept. AI embeddings find the most relevant verses.
      </p>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative flex gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              id="search-page-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="How do I remain patient during difficult times?"
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-base shadow-sm"
              aria-label="Search query"
            />
          </div>
          <button
            id="search-submit"
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="px-6 py-4 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Search"
            )}
          </button>
        </div>

        {/* Example queries */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            "patience during hardship",
            "mercy of Allah",
            "Day of Judgment",
            "gratitude and thankfulness",
            "paradise and believers",
          ].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setInputValue(ex);
                setQuery(ex);
                router.replace(`/search?q=${encodeURIComponent(ex)}`, { scroll: false });
                runSearch(ex);
              }}
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {hasSearched && !loading && (
        <div>
          {results.length > 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {results.length} results for &ldquo;{query}&rdquo;
              </p>
              <div className="space-y-3">
                {results.map((result, idx) => (
                  <Link
                    key={result.verse_id}
                    href={`/verse/${encodeURIComponent(result.verse_id)}`}
                    id={`search-result-${idx}`}
                    className="group block p-5 border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-md transition-all bg-white"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">
                          {result.surah_name_en} {formatVerseId(result.verse_id)}
                        </span>
                        {result.community !== null && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: getCommunityColor(result.community) }}
                          >
                            C{result.community}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{result.revelation_place}</span>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-gray-900">
                        {formatSimilarity(result.score)}
                      </span>
                    </div>

                    {/* Score bar */}
                    <div className="w-full h-1 bg-gray-100 rounded-full mb-3 overflow-hidden">
                      <div
                        className="h-full bg-gray-900 rounded-full transition-all"
                        style={{ width: `${Math.round(result.score * 100)}%` }}
                      />
                    </div>

                    <p className="text-sm text-gray-700 italic line-clamp-3">
                      &ldquo;{result.english}&rdquo;
                    </p>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 border border-gray-200 rounded-2xl">
              <p className="text-gray-500 font-medium">No results found</p>
              <p className="text-sm text-gray-400 mt-1">Try a different query or check that the backend is running</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="h-8 bg-gray-100 rounded w-48 animate-pulse mb-8" />
        <div className="h-14 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
