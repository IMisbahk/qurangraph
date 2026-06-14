import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import SearchBar from "@/components/search/SearchBar";
import AudioPlayer from "@/components/shared/AudioPlayer";
import type { StatsResponse } from "@/types";

export const metadata: Metadata = {
  title: "QuranGraph — Discover Hidden Connections",
  description:
    "Explore the Quran through beautiful visual connections, discover deep thematic topics, and search concepts naturally.",
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
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard value={stats.verse_count.toLocaleString()} label="Verses Mapped" description="The complete Quran" />
          <StatCard value={stats.edge_count.toLocaleString()} label="Connections Found" description="Related verses linked together" />
          <StatCard value={stats.community_count.toString()} label="Thematic Topics" description="Distinct clusters of meaning" />
        </div>
      </section>

      {stats.most_connected_verse && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50 rounded-3xl p-8 sm:p-10 shadow-sm">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <svg className="w-32 h-32 text-emerald-900" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L22 12L12 22L2 12L12 2Z" />
              </svg>
            </div>
            
            <p className="text-sm font-semibold text-emerald-600 tracking-wide uppercase mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Featured Insight
            </p>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative z-10">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.most_connected_verse}</h3>
                <p className="text-base text-gray-600 max-w-md">
                  This verse forms the heart of the network, directly connecting to {stats.most_connected_verse_degree} other verses.
                </p>
              </div>
              <Link
                href={`/verse/${encodeURIComponent(stats.most_connected_verse)}`}
                className="shrink-0 px-6 py-3 bg-emerald-600 text-white text-sm font-medium rounded-xl shadow-sm hover:bg-emerald-700 hover:shadow transition-all focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                Discover Why →
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
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/50 border border-gray-100 rounded-3xl p-6 animate-pulse">
            <div className="h-10 bg-gray-100 rounded w-20 mb-3" />
            <div className="h-5 bg-gray-100 rounded w-32 mb-2" />
            <div className="h-4 bg-gray-50 rounded w-24" />
          </div>
        ))}
      </div>
    </section>
  );
}

async function DailyInspirationSection() {
  let verse = null;
  try {
    verse = await api.getVerseOfTheDay();
  } catch (error) {
    console.error("Failed to load verse of the day:", error);
    return null;
  }
  if (!verse) return null;

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 to-teal-950 text-white rounded-3xl p-8 sm:p-10 shadow-md border border-emerald-700/20">
        {/* Background Islamic Star Pattern Accent */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.04] pointer-events-none">
          <svg className="w-40 h-40 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L22 12L12 22L2 12L12 2Z" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-4 mb-6">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[11px] font-bold text-emerald-200 border border-white/5">
              <span className="text-amber-400">★</span> Daily Inspiration
            </span>
            <AudioPlayer ayahQuran={verse.ayah_quran} size="sm" />
          </div>

          <p
            dir="rtl"
            lang="ar"
            className="font-arabic text-2xl sm:text-3xl text-emerald-50 leading-loose text-right mb-6 select-none"
          >
            {verse.arabic}
          </p>

          <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed italic mb-6">
            &ldquo;{verse.english}&rdquo;
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10 pt-5">
            <div>
              <p className="text-sm font-bold text-white">{verse.surah_name_en} {verse.surah}:{verse.ayah}</p>
              <p className="text-xs text-emerald-200/60 mt-0.5">Surah {verse.surah} · Quran #{verse.ayah_quran}</p>
            </div>
            <Link
              href={`/verse/${encodeURIComponent(verse.verse_id)}`}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow text-center sm:text-left"
            >
              Explore Connections →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function DailyInspirationSkeleton() {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-10 shadow-sm animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 bg-gray-100 rounded w-32" />
          <div className="h-8 w-8 bg-gray-100 rounded-full" />
        </div>
        <div className="h-12 bg-gray-50 rounded mb-6 w-full" />
        <div className="h-8 bg-gray-50 rounded mb-6 w-2/3" />
        <div className="border-t border-gray-100 pt-5 flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 rounded w-24" />
            <div className="h-3 bg-gray-50 rounded w-16" />
          </div>
          <div className="h-8 bg-gray-100 rounded w-28" />
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-56px)] selection:bg-emerald-100 selection:text-emerald-900">
      {/* Hero Background Elements with subtle Islamic Geometric Pattern */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none bg-white">
        {/* Geometric pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='1'%3E%3Cpath d='M30 0l15 15-15 15L15 15 30 0zm0 30l15 15-15 15-15-15L30 30zm-15-15l15 15-15 15-15-15 15-15zm30 0l15 15-15 15-15-15 15-15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-50/50 blur-[100px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-teal-50/40 blur-[100px]" />
      </div>

      {/* Hero — renders immediately, no async blocking */}
      <section className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 text-center">
        
        {/* Bismillah Calligraphy */}
        <div className="font-arabic text-3xl sm:text-4xl text-emerald-800/60 mb-8 select-none" dir="rtl">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full text-sm font-medium text-emerald-700 mb-8 shadow-sm border border-emerald-100/50">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          A beautiful new way to explore
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6">
          Discover the Hidden <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Connections</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
          Journey through the Quran like never before. See how verses interlink, explore deep thematic topics, and ask questions naturally to find the answers you seek.
        </p>

        <div className="flex justify-center mb-6 relative z-20">
          <SearchBar />
        </div>
        <p className="text-sm text-gray-400 font-medium">
          Try asking: <span className="text-gray-600">"What does it say about patience during hardship?"</span>
        </p>
      </section>

      {/* Daily Inspiration — streamed asynchronously */}
      <Suspense fallback={<DailyInspirationSkeleton />}>
        <DailyInspirationSection />
      </Suspense>

      {/* Stats — streamed after hero, won't block page load */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      {/* Feature cards — always visible immediately */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Five Ways to Explore</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Whether you're looking for a specific topic, wanting to see the big picture, or just exploring.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            href="/graph"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            }
            title="Visual Explorer"
            description="See the beautiful network of connections. Click on any verse to see how it links to others across different chapters."
            cta="Open Map"
            colorClass="from-blue-50 to-indigo-50 text-indigo-600"
          />
          <FeatureCard
            href="/chapters"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            title="Surah Index"
            description="Browse the Quran chapter-by-chapter. View full surah details, listen to recitations, and see how they are structured."
            cta="Browse Chapters"
            colorClass="from-purple-50 to-pink-50 text-purple-600"
          />
          <FeatureCard
            href="/bridges"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            }
            title="Quranic Bridges"
            description="Discover how concepts transition across verses. Trace the shortest semantic path between any two ayah references."
            cta="Discover Paths"
            colorClass="from-teal-50 to-emerald-50 text-teal-600"
          />
          <FeatureCard
            href="/communities"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            }
            title="Themes & Topics"
            description="Browse through naturally formed clusters of meaning. From profound themes of mercy to stories of past nations."
            cta="Browse Topics"
            colorClass="from-emerald-50 to-teal-50 text-emerald-600"
          />
          <FeatureCard
            href="/search"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            }
            title="Smart Search"
            description="Don't know the exact phrasing? Type what you're thinking of, and our intelligent search will find the right verses."
            cta="Try Search"
            colorClass="from-amber-50 to-orange-50 text-orange-600"
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({ value, label, description }: { value: string; label: string; description: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group">
      <p className="text-4xl font-extrabold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">{value}</p>
      <p className="text-base font-semibold text-gray-800">{label}</p>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  );
}

function FeatureCard({
  href, icon, title, description, cta, colorClass
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  colorClass: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col h-full bg-white border border-gray-100 rounded-3xl p-8 hover:border-gray-200 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-base text-gray-500 leading-relaxed mb-8 flex-grow">{description}</p>
      
      <div className="flex items-center text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors mt-auto">
        {cta}
        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </Link>
  );
}
