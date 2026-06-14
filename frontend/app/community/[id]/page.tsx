import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { getCommunityColor, formatVerseId, formatSimilarity } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const communityId = parseInt(id, 10);
  if (!isNaN(communityId)) {
    try {
      const data = await api.getCommunity(communityId);
      if (data && data.stats.theme_name) {
        return {
          title: `${data.stats.theme_name} (Theme ${communityId}) — QuranGraph`,
          description: `Explore verses belonging to Theme: "${data.stats.theme_name}" in the Quran knowledge graph.`,
        };
      }
    } catch {}
  }
  return {
    title: `Community ${id} — QuranGraph`,
    description: `Explore verses belonging to Community ${id} in the Quran knowledge graph.`,
  };
}

export default async function CommunityPage({ params }: Props) {
  const { id } = await params;
  const communityId = parseInt(id, 10);

  if (isNaN(communityId)) notFound();

  let data: { stats: Awaited<ReturnType<typeof api.getCommunity>>["stats"]; verses: Awaited<ReturnType<typeof api.getCommunity>>["verses"] } | null = null;
  try {
    data = await api.getCommunity(communityId);
  } catch (error) {
    notFound();
  }

  if (!data) notFound();

  const { stats, verses } = data;
  const color = getCommunityColor(communityId);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/communities" className="hover:text-gray-900 transition-colors">Communities</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Theme {communityId}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-2xl shrink-0"
            style={{ backgroundColor: color }}
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wider" style={{ backgroundColor: color }}>
                Theme {communityId}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
              {stats.theme_name || `Thematic Cluster ${communityId}`}
            </h1>
            <p className="text-gray-500 text-sm">
              {stats.size} verses · {(stats.density * 100).toFixed(1)}% density ·{" "}
              {(stats.avg_similarity * 100).toFixed(1)}% avg similarity
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <Link
            href={`/graph?community=${communityId}`}
            id={`view-community-graph-${communityId}`}
            className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            View in Graph
          </Link>
        </div>
      </div>


      {/* Central verse */}
      <div className="border border-gray-200 rounded-2xl p-6 mb-8">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Central Verse
        </p>
        <Link
          href={`/verse/${encodeURIComponent(stats.central_verse_id)}`}
          className="group"
        >
          <p className="text-lg font-semibold text-gray-900 group-hover:text-gray-600 transition-colors mb-1">
            {formatVerseId(stats.central_verse_id)}
          </p>
          <p className="text-gray-600 italic">&ldquo;{stats.central_verse_english}&rdquo;</p>
        </Link>
      </div>

      {/* All verses */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          All Verses ({verses.length})
        </h2>
        <div className="space-y-3">
          {verses.map((verse) => (
            <Link
              key={verse.verse_id}
              href={`/verse/${encodeURIComponent(verse.verse_id)}`}
              id={`community-verse-${verse.verse_id.replace(":", "-")}`}
              className="group flex items-start gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all bg-white"
            >
              {/* Verse ID */}
              <div className="shrink-0 text-center">
                <p className="text-sm font-bold text-gray-900">{verse.surah}:{verse.ayah}</p>
                <p className="text-xs text-gray-400">{verse.surah_name_en}</p>
              </div>

              <div className="flex-1 min-w-0">
                {/* Arabic */}
                <p
                  dir="rtl"
                  lang="ar"
                  className="text-base text-gray-700 leading-loose mb-2 text-right"
                  style={{ fontFamily: "'Scheherazade New', serif" }}
                >
                  {verse.arabic}
                </p>
                {/* English */}
                <p className="text-sm text-gray-600 italic line-clamp-2">{verse.english}</p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs text-gray-400">{verse.revelation_place}</p>
                {verse.degree !== null && (
                  <p className="text-xs text-gray-400 mt-0.5">deg {verse.degree}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
