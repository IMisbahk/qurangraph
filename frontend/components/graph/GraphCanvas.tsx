"use client";

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import type { GraphData, GraphNode, GraphEdge } from "@/types";
import { getCommunityColor, degreeToRadius, truncate } from "@/lib/utils";

interface GraphCanvasProps {
  data: GraphData;
  highlightIds?: Set<string>;
  onNodeClick?: (node: GraphNode) => void;
  filterCommunity?: number | null;
}

export interface GraphCanvasRef {
  zoomToNode: (id: string) => void;
  resetZoom: () => void;
}

interface FilteredData {
  nodes: GraphNode[];
  links: GraphEdge[];
}

const GraphCanvas = forwardRef<GraphCanvasRef, GraphCanvasProps>(
  ({ data, highlightIds, onNodeClick, filterCommunity }, ref) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fgRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [ForceGraph, setForceGraph] = useState<any>(null);
    const [filteredData, setFilteredData] = useState<FilteredData>({
      nodes: [],
      links: [],
    });

    // Dynamically import to avoid SSR issues
    useEffect(() => {
      import("react-force-graph-2d").then((mod) => {
        setForceGraph(() => mod.default);
      });
    }, []);

    // Apply community filter
    useEffect(() => {
      let nodes = data.nodes;
      let edges = data.edges;

      if (filterCommunity !== null && filterCommunity !== undefined) {
        nodes = data.nodes.filter((n) => n.community === filterCommunity);
        const nodeIds = new Set(nodes.map((n) => n.id));
        edges = data.edges.filter((e) => {
          const src = typeof e.source === "string" ? e.source : (e.source as GraphNode).id;
          const tgt = typeof e.target === "string" ? e.target : (e.target as GraphNode).id;
          return nodeIds.has(src) && nodeIds.has(tgt);
        });
      }

      setFilteredData({ nodes, links: edges });
    }, [data, filterCommunity]);

    useImperativeHandle(ref, () => ({
      zoomToNode: (_id: string) => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(400);
        }
      },
      resetZoom: () => {
        if (fgRef.current) fgRef.current.zoomToFit(400);
      },
    }));

    const nodeColor = useCallback(
      (node: object) => {
        const n = node as GraphNode;
        if (highlightIds && highlightIds.size > 0) {
          return highlightIds.has(n.id) ? getCommunityColor(n.community) : "#e5e7eb";
        }
        return getCommunityColor(n.community);
      },
      [highlightIds]
    );

    const nodeVal = useCallback((node: object) => {
      const n = node as GraphNode;
      return degreeToRadius(n.degree);
    }, []);

    const nodeLabel = useCallback((node: object) => {
      const n = node as GraphNode;
      return `<div style="max-width:240px;padding:8px;font-family:sans-serif;font-size:12px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1)">
        <div style="font-weight:600;color:#111;margin-bottom:4px">${n.surah_name_en} ${n.id}</div>
        <div style="color:#374151;line-height:1.4">${truncate(n.english, 100)}</div>
        <div style="color:#9ca3af;margin-top:4px;font-size:11px">Community ${n.community} · Degree ${n.degree}</div>
      </div>`;
    }, []);

    const linkColor = useCallback(
      (link: object) => {
        const l = link as GraphEdge;
        const src = typeof l.source === "string" ? l.source : (l.source as GraphNode).id;
        const tgt = typeof l.target === "string" ? l.target : (l.target as GraphNode).id;
        if (highlightIds && (highlightIds.has(src) || highlightIds.has(tgt))) {
          return "rgba(17,17,17,0.4)";
        }
        return "rgba(209,213,219,0.3)";
      },
      [highlightIds]
    );

    const linkWidth = useCallback((link: object) => {
      const l = link as GraphEdge;
      return Math.max(0.5, l.similarity * 2);
    }, []);

    const handleNodeClick = useCallback(
      (node: object) => {
        onNodeClick?.(node as GraphNode);
      },
      [onNodeClick]
    );

    if (!ForceGraph) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading graph engine...</p>
          </div>
        </div>
      );
    }

    const FG = ForceGraph;

    return (
      <FG
        ref={fgRef}
        graphData={filteredData}
        nodeId="id"
        nodeColor={nodeColor}
        nodeVal={nodeVal}
        nodeLabel={nodeLabel}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkSource="source"
        linkTarget="target"
        onNodeClick={handleNodeClick}
        cooldownTicks={100}
        onEngineStop={() => {
          if (fgRef.current) fgRef.current.zoomToFit(400);
        }}
        backgroundColor="#ffffff"
        width={typeof window !== "undefined" ? window.innerWidth : 1200}
        height={typeof window !== "undefined" ? window.innerHeight - 64 : 800}
        nodeCanvasObjectMode={() => "after"}
        nodeCanvasObject={(node: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const n = node as GraphNode & { x?: number; y?: number };
          if (globalScale > 4 && n.x !== undefined && n.y !== undefined) {
            ctx.font = `${9 / globalScale}px Inter, sans-serif`;
            ctx.fillStyle = "#374151";
            ctx.textAlign = "center";
            ctx.fillText(n.id, n.x, n.y + degreeToRadius(n.degree) + 3);
          }
        }}
      />
    );
  }
);

GraphCanvas.displayName = "GraphCanvas";
export default GraphCanvas;
