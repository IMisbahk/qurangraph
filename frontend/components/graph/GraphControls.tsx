"use client";

import { useState } from "react";
import type { GraphData } from "@/types";
import { getCommunityColor } from "@/lib/utils";

interface GraphControlsProps {
  data: GraphData;
  filterCommunity: number | null;
  onFilterChange: (community: number | null) => void;
  onResetZoom: () => void;
  highlightQuery: string;
  onHighlightQuery: (q: string) => void;
}

export default function GraphControls({
  data,
  filterCommunity,
  onFilterChange,
  onResetZoom,
  highlightQuery,
  onHighlightQuery,
}: GraphControlsProps) {
  const [open, setOpen] = useState(false);

  // Get unique communities sorted by ID
  const communities = Array.from(
    new Set(data.nodes.map((n) => n.community))
  ).sort((a, b) => a - b);

  return (
    <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
      {/* Zoom controls */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <button
          id="graph-reset-zoom"
          onClick={onResetZoom}
          className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-900"
          title="Reset zoom"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Highlight search */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-2">
        <input
          id="graph-highlight-search"
          type="text"
          value={highlightQuery}
          onChange={(e) => onHighlightQuery(e.target.value)}
          placeholder="Highlight nodes..."
          className="w-36 text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 text-gray-900 placeholder-gray-400"
        />
      </div>

      {/* Community filter */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <button
          id="graph-community-filter-toggle"
          onClick={() => setOpen((o) => !o)}
          className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>
            {filterCommunity !== null ? `Community ${filterCommunity}` : "All Communities"}
          </span>
          <svg
            className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="border-t border-gray-100 max-h-64 overflow-y-auto divide-y divide-gray-50">
            <button
              onClick={() => { onFilterChange(null); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors ${filterCommunity === null ? "bg-gray-50 font-semibold" : ""}`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
              All Communities
              <span className="ml-auto text-gray-400">{data.nodes.length}</span>
            </button>
            {communities.map((cid) => {
              const count = data.nodes.filter((n) => n.community === cid).length;
              return (
                <button
                  key={cid}
                  id={`filter-community-${cid}`}
                  onClick={() => { onFilterChange(cid); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors ${filterCommunity === cid ? "bg-gray-50 font-semibold" : ""}`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: getCommunityColor(cid) }}
                  />
                  Community {cid}
                  <span className="ml-auto text-gray-400">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats overlay */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-2.5">
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-gray-900">{data.node_count.toLocaleString()}</span> verses
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          <span className="font-semibold text-gray-900">{data.edge_count.toLocaleString()}</span> connections
        </p>
      </div>
    </div>
  );
}
