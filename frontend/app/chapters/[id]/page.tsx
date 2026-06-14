import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import SurahDetail from "@/components/chapters/SurahDetail";
import type { Verse } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const surahId = parseInt(id, 10);

  if (isNaN(surahId) || surahId < 1 || surahId > 114) {
    return {
      title: "Surah Not Found — QuranGraph",
    };
  }

  try {
    const verses = await api.getSurahVerses(surahId);
    if (verses.length > 0) {
      const first = verses[0];
      return {
        title: `Surah ${first.surah_name_en} (${first.surah_name_ar}) — QuranGraph`,
        description: `Read and explore Surah ${first.surah_name_en} with translations, audio recitations, and semantic connections.`,
      };
    }
  } catch {}

  return {
    title: `Surah ${surahId} — QuranGraph`,
  };
}

export default async function SurahDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sParams = await searchParams;
  const surahId = parseInt(id, 10);
  const autoplay = sParams.autoplay === "true";

  if (isNaN(surahId) || surahId < 1 || surahId > 114) {
    notFound();
  }

  let verses: Verse[] = [];
  try {
    verses = await api.getSurahVerses(surahId);
  } catch (error) {
    notFound();
  }

  if (verses.length === 0) {
    notFound();
  }

  const firstVerse = verses[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/chapters" className="hover:text-gray-900 transition-colors">Chapters</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{firstVerse.surah_name_en}</span>
      </nav>

      <SurahDetail key={surahId} verses={verses} surahId={surahId} autoplay={autoplay} />
    </div>
  );
}
