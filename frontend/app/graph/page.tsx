"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { GraphNode, NeighborResult } from "@/types";
import GraphCanvas, { type GraphCanvasRef } from "@/components/graph/GraphCanvas";
import NodePanel from "@/components/graph/NodePanel";
import GraphControls from "@/components/graph/GraphControls";

export default function GraphPage() {
  const canvasRef = useRef<GraphCanvasRef>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [neighbors, setNeighbors] = useState<NeighborResult[]>([]);
  const [neighborsLoading, setNeighborsLoading] = useState(false);
  const [filterCommunity, setFilterCommunity] = useState<number | null>(null);
  const [highlightQuery, setHighlightQuery] = useState("");
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());

  const { data: graphData, isLoading, error } = useQuery({
    queryKey: ["graph"],
    queryFn: () => api.getGraph(),
    staleTime: Infinity,
  });

  // Highlight nodes matching search query
  useEffect(() => {
    if (!graphData || !highlightQuery.trim()) {
      setHighlightIds(new Set());
      return;
    }
    const q = highlightQuery.toLowerCase();
    const matched = new Set(
      graphData.nodes
        .filter(
          (n) =>
            n.english.toLowerCase().includes(q) ||
            n.id.includes(q) ||
            n.surah_name_en.toLowerCase().includes(q)
        )
        .map((n) => n.id)
    );
    setHighlightIds(matched);
  }, [highlightQuery, graphData]);

  const handleNodeClick = useCallback(async (node: GraphNode) => {
    setSelectedNode(node);
    setNeighborsLoading(true);
    try {
      const nbrs = await api.getNeighbors(node.id, 10);
      setNeighbors(nbrs);
    } catch {
      setNeighbors([]);
    } finally {
      setNeighborsLoading(false);
    }
  }, []);

  const handleNavigateToNode = useCallback(
    (id: string) => {
      if (!graphData) return;
      const node = graphData.nodes.find((n) => n.id === id);
      if (node) {
        handleNodeClick(node);
        canvasRef.current?.zoomToNode(id);
      }
    },
    [graphData, handleNodeClick]
  );

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading knowledge graph...</p>
          <p className="text-sm text-gray-400 mt-1">This may take a moment for 6,236 verses</p>
        </div>
      </div>
    );
  }

  if (error || !graphData) {
    return (
      <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-white">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Graph not available</h2>
          <p className="text-sm text-gray-500 mb-4">
            The backend is not running or the graph has not been built yet.
          </p>
          <div className="text-xs text-left bg-gray-50 border border-gray-200 rounded-xl p-4 font-mono text-gray-600 space-y-1">
            <p>python backend/scripts/generate_embeddings.py</p>
            <p>python backend/scripts/build_index.py</p>
            <p>python backend/scripts/build_graph.py</p>
            <p>uvicorn backend.main:app --reload</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-56px)] bg-white overflow-hidden">
      {/* Page title for SEO */}
      <h1 className="sr-only">QuranGraph — Interactive Knowledge Graph</h1>

      <GraphCanvas
        ref={canvasRef}
        data={graphData}
        highlightIds={highlightIds}
        onNodeClick={handleNodeClick}
        filterCommunity={filterCommunity}
      />

      <GraphControls
        data={graphData}
        filterCommunity={filterCommunity}
        onFilterChange={setFilterCommunity}
        onResetZoom={() => canvasRef.current?.resetZoom()}
        highlightQuery={highlightQuery}
        onHighlightQuery={setHighlightQuery}
      />

      {selectedNode && (
        <NodePanel
          node={selectedNode}
          neighbors={neighbors}
          loading={neighborsLoading}
          onClose={() => setSelectedNode(null)}
          onNavigateToNode={handleNavigateToNode}
        />
      )}

      {/* Highlight result count */}
      {highlightIds.size > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-full shadow-lg z-30">
          {highlightIds.size} verse{highlightIds.size !== 1 ? "s" : ""} highlighted
        </div>
      )}
    </div>
  );
}
