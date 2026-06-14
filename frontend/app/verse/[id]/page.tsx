import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { getCommunityColor, formatVerseId, formatSimilarity } from "@/lib/utils";
import type { Verse, NeighborResult } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  return {
    title: `${decodedId} — QuranGraph`,
    description: `Verse ${decodedId} with Arabic text, English translation, and semantically similar verses.`,
  };
}

export default async function VersePage({ params }: Props) {
  const { id } = await params;
  const verseId = decodeURIComponent(id);

  let verse: Verse | null = null;
  let neighbors: NeighborResult[] | null = null;

  try {
    verse = await api.getVerse(verseId);
  } catch {
    notFound();
  }

  try {
    neighbors = await api.getNeighbors(verseId, 12);
  } catch {
    neighbors = []; // Silently fallback to no neighbors if it fails (e.g. 404 No neighbors found)
  }

  if (!verse) notFound();

  const communityColor = getCommunityColor(verse.community ?? 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/search" className="hover:text-gray-900 transition-colors">Search</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{verseId}</span>
      </nav>

      {/* Verse header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          {verse.community !== null && (
            <Link
              href={`/community/${verse.community}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: communityColor }}
            >
              Community {verse.community}
            </Link>
          )}
          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2.5 py-1">
            {verse.revelation_place}
          </span>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-1">
          {verse.surah_name_en}
        </h1>
        <p className="text-gray-500">
          Surah {verse.surah}, Verse {verse.ayah} · Quran #{verse.ayah_quran}
        </p>
      </div>

      {/* Arabic text */}
      <div className="border border-gray-200 rounded-2xl p-8 mb-6 bg-gray-50">
        <p
          dir="rtl"
          lang="ar"
          className="text-3xl text-gray-900 leading-loose text-right"
          style={{ fontFamily: "'Scheherazade New', 'Amiri', serif" }}
        >
          {verse.arabic}
        </p>
      </div>

      {/* English translation */}
      <div className="border border-gray-200 rounded-2xl p-8 mb-8">
        <p className="text-xl text-gray-700 leading-relaxed italic">
          &ldquo;{verse.english}&rdquo;
        </p>
      </div>

      {/* Graph analytics */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Connections</p>
          <p className="text-2xl font-bold text-gray-900">{verse.degree ?? 0}</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Community</p>
          <p className="text-2xl font-bold text-gray-900">{verse.community ?? "—"}</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">PageRank</p>
          <p className="text-2xl font-bold text-gray-900">
            {verse.pagerank ? verse.pagerank.toExponential(2) : "—"}
          </p>
        </div>
      </div>

      {/* Similar verses */}
      {neighbors && neighbors.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Semantically Similar Verses
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            You may also find these verses relevant
          </p>
          <div className="space-y-3">
            {neighbors.map((n) => (
              <Link
                key={n.verse_id}
                href={`/verse/${encodeURIComponent(n.verse_id)}`}
                id={`neighbor-${n.verse_id.replace(":", "-")}`}
                className="group flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all bg-white"
              >
                <div className="shrink-0">
                  <p className="text-sm font-bold text-gray-900">{n.surah}:{n.ayah}</p>
                  <p className="text-xs text-gray-400">{n.surah_name_en}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 italic line-clamp-2">{n.english}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className="text-xs font-mono rounded px-2 py-0.5"
                    style={{
                      backgroundColor: `${getCommunityColor(n.community ?? 0)}18`,
                      color: getCommunityColor(n.community ?? 0),
                    }}
                  >
                    {formatSimilarity(n.similarity)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-10 flex gap-3">
        <Link
          href={`/graph`}
          id="view-in-graph"
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors"
        >
          View in Graph
        </Link>
        {verse.community !== null && (
          <Link
            href={`/community/${verse.community}`}
            id={`verse-community-link-${verse.community}`}
            className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Explore Community {verse.community}
          </Link>
        )}
      </div>
    </div>
  );
}
