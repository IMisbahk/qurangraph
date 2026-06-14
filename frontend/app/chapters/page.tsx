import type { Metadata } from "next";
import { api } from "@/lib/api";
import SurahList from "@/components/chapters/SurahList";

export const metadata: Metadata = {
  title: "Chapters & Surahs — QuranGraph",
  description:
    "Explore the Quran chapter by chapter. Browse the 114 Surahs, view their details, revelation places, and explore semantic connections.",
};

async function getSurahs() {
  try {
    return await api.getSurahs();
  } catch (error) {
    console.error("Failed to fetch surahs:", error);
    return [];
  }
}

export default async function ChaptersPage() {
  const surahs = await getSurahs();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Chapters & Surahs</h1>
        </div>
        <p className="text-gray-500 max-w-2xl">
          Browse through the 114 chapters of the Quran. Select any Surah to view all its verses, listen to audio recitations, and map their semantic relations.
        </p>
      </div>

      <SurahList surahs={surahs} />
    </div>
  );
}
