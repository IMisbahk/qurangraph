import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import SearchBar from "@/components/search/SearchBar";
import type { StatsResponse } from "@/types";

export const metadata: Metadata = {
  title: "QuranGraph — The Semantic Map of the Quran",
  description:
    "Explore 6,236 Quran verses through AI embeddings, semantic graph intelligence, and community detection. The world's first interactive Quran knowledge graph.",
};

// Isolated async component — streamed independently, won't block the hero
async function StatsSection() {
  let stats: StatsResponse | null = null;
  try {
    stats = await api.getStats();
  } catch {
    return null; // backend not ready — silently skip stats
  }
  if (!stats) return null;

  return (
    <>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard value={stats.verse_count.toLocaleString()} label="Verses" description="Complete Quran" />
          <StatCard value={stats.edge_count.toLocaleString()} label="Connections" description="Semantic edges" />
          <StatCard value={stats.community_count.toString()} label="Communities" description="Thematic clusters" />
          <StatCard value={stats.avg_degree.toFixed(1)} label="Avg Degree" description="Connections/verse" />
        </div>
      </section>

      {stats.most_connected_verse && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="border border-gray-200 rounded-2xl p-6">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Most Connected Verse
            </p>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stats.most_connected_verse}</p>
                <p className="text-sm text-gray-500">
                  {stats.most_connected_verse_degree} direct connections in the graph
                </p>
              </div>
              <Link
                href={`/verse/${encodeURIComponent(stats.most_connected_verse)}`}
                className="shrink-0 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors"
              >
                Explore
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function StatsSkeleton() {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
            <div className="h-8 bg-gray-100 rounded w-16 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-24 mb-1" />
            <div className="h-3 bg-gray-100 rounded w-20" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-56px)]">
      {/* Hero — renders immediately, no async blocking */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600 mb-8">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Powered by local AI · Ollama embeddinggemma:300m
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
          The Semantic Map<br />
          <span className="text-gray-400">of the Quran</span>
        </h1>

        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Explore over 6,000 verses through embeddings, graph intelligence,
          and semantic relationships. Discover thematic clusters, find connected
          verses, and navigate the Quran as a living knowledge graph.
        </p>

        <div className="flex justify-center mb-4">
          <SearchBar />
        </div>
        <p className="text-xs text-gray-400">
          Try: &ldquo;patience during hardship&rdquo; · &ldquo;mercy of Allah&rdquo; · &ldquo;Day of Judgment&rdquo;
        </p>
      </section>

      {/* Stats — streamed after hero, won't block page load */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      {/* Feature cards — always visible immediately */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FeatureCard
            href="/graph"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
                <circle cx="4" cy="6" r="2" strokeWidth={1.5} />
                <circle cx="20" cy="6" r="2" strokeWidth={1.5} />
                <circle cx="4" cy="18" r="2" strokeWidth={1.5} />
                <circle cx="20" cy="18" r="2" strokeWidth={1.5} />
                <path strokeWidth={1.5} d="M6 6.5L10 9M14 9l4-2.5M6 17.5L10 15M14 15l4 2.5" />
              </svg>
            }
            title="Graph Explorer"
            description="Navigate the full knowledge graph. Zoom, pan, filter by community, and click any verse to explore its connections."
            cta="Open Graph →"
          />
          <FeatureCard
            href="/communities"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            title="Community Explorer"
            description="Discover thematic clusters automatically detected by Louvain community detection across all 6,236 verses."
            cta="View Communities →"
          />
          <FeatureCard
            href="/search"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            }
            title="Semantic Search"
            description="Type any concept or question in natural language. AI embeddings surface the most relevant verses instantly."
            cta="Start Searching →"
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({ value, label, description }: { value: string; label: string; description: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{description}</p>
    </div>
  );
}

function FeatureCard({
  href, icon, title, description, cta,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      id={`feature-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className="group block bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-400 hover:shadow-md transition-all"
    >
      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center mb-4 text-gray-700 group-hover:bg-gray-900 group-hover:text-white transition-colors">
        {icon}
      </div>
      <h2 className="text-base font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-500 leading-relaxed mb-4">{description}</p>
      <p className="text-sm font-medium text-gray-900">{cta}</p>
    </Link>
  );
}
