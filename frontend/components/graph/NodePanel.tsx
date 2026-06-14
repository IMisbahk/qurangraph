"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GraphNode, NeighborResult } from "@/types";
import { getCommunityColor, formatVerseId, formatSimilarity } from "@/lib/utils";

interface NodePanelProps {
  node: GraphNode | null;
  neighbors: NeighborResult[];
  loading: boolean;
  onClose: () => void;
  onNavigateToNode?: (id: string) => void;
}

export default function NodePanel({
  node,
  neighbors,
  loading,
  onClose,
  onNavigateToNode,
}: NodePanelProps) {
  const router = useRouter();

  if (!node) return null;

  const communityColor = getCommunityColor(node.community);

  return (
    <div className="absolute top-4 right-4 w-96 max-h-[calc(100vh-2rem)] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-40">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-gray-100">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: communityColor }}
            />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {node.surah_name_en}
            </span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 leading-tight">
            {formatVerseId(node.id)}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {node.revelation_place} · Community {node.community} · Degree {node.degree}
          </p>
        </div>
        <button
          id="close-node-panel"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 shrink-0"
          aria-label="Close panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Arabic text */}
        <div className="p-5 border-b border-gray-100">
          <p
            dir="rtl"
            lang="ar"
            className="text-xl text-gray-900 leading-loose text-right font-arabic"
            style={{ fontFamily: "'Scheherazade New', 'Amiri', serif" }}
          >
            {node.arabic}
          </p>
        </div>

        {/* English translation */}
        <div className="p-5 border-b border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed italic">
            &ldquo;{node.english}&rdquo;
          </p>
        </div>

        {/* Analytics */}
        <div className="p-5 border-b border-gray-100">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wide">PageRank</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {node.pagerank.toExponential(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Degree</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{node.degree}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Community</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{node.community}</p>
            </div>
          </div>
        </div>

        {/* Similar verses */}
        <div className="p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Semantically Similar
          </h3>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : neighbors.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No neighbors found</p>
          ) : (
            <div className="space-y-2">
              {neighbors.slice(0, 8).map((n) => (
                <button
                  key={n.verse_id}
                  onClick={() => onNavigateToNode?.(n.verse_id)}
                  className="w-full text-left p-3 rounded-xl hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">
                        {n.surah_name_en} {formatVerseId(n.verse_id)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.english}</p>
                    </div>
                    <span
                      className="shrink-0 text-xs font-mono rounded px-1.5 py-0.5 mt-0.5"
                      style={{
                        backgroundColor: `${getCommunityColor(n.community ?? 0)}15`,
                        color: getCommunityColor(n.community ?? 0),
                      }}
                    >
                      {formatSimilarity(n.similarity)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-gray-100 flex gap-2">
        <button
          id={`view-verse-${node.id.replace(":", "-")}`}
          onClick={() => router.push(`/verse/${encodeURIComponent(node.id)}`)}
          className="flex-1 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          View Full Verse
        </button>
        <button
          id={`view-community-${node.community}`}
          onClick={() => router.push(`/community/${node.community}`)}
          className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Community
        </button>
      </div>
    </div>
  );
}
