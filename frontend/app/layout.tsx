import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import NavBar from "@/components/layout/NavBar";
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuranGraph — Semantic Knowledge Graph of the Quran",
  description:
    "Explore over 6,200 Quran verses through AI embeddings, graph intelligence, and semantic relationships. Discover connections you've never seen before.",
  keywords: ["Quran", "semantic search", "knowledge graph", "Islamic", "AI", "embeddings"],
  openGraph: {
    title: "QuranGraph",
    description: "The Semantic Map of the Quran",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return ( <>
    <html lang="en" className={inter.variable}>
      <body className="bg-white text-gray-900 antialiased min-h-screen">
        <QueryProvider>
          <NavBar />
          <main>{children}</main>
        </QueryProvider>

      </body>
    </html>
    <Analytics/>
    <footer className="flex justify-center items-center gap-1.5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
      <span>Developed with</span>
      <span aria-label="love" role="img">❤️</span>
      <span>by</span>
      <a href="https://imisbahk.vercel.app" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900 transition-colors font-medium">Misbah Khursheed</a>
    </footer>
  </>
  

  );
}
