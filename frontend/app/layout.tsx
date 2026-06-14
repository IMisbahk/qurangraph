import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import NavBar from "@/components/layout/NavBar";

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
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-white text-gray-900 antialiased min-h-screen">
        <QueryProvider>
          <NavBar />
          <main>{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
