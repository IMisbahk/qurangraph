import type { CommunityStats } from "@/types";
import { getCommunityColor } from "@/lib/utils";
import Link from "next/link";

interface CommunityListProps {
  communities: CommunityStats[];
}

export default function CommunityList({ communities }: CommunityListProps) {
  if (!communities || communities.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No community data available.</p>
        <p className="text-sm text-gray-400 mt-2">Run the graph pipeline first.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {communities.map((c) => {
        const color = getCommunityColor(c.community_id);
        return (
          <Link
            key={c.community_id}
            href={`/community/${c.community_id}`}
            id={`community-card-${c.community_id}`}
            className="group block bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-400 hover:shadow-md transition-all"
          >
            {/* Color stripe + ID */}
            <div className="flex items-center gap-3 mb-4 min-w-0 w-full">
              <div
                className="w-8 h-8 rounded-lg shrink-0"
                style={{ backgroundColor: color }}
              />
              <div className="min-w-0 flex-grow">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Theme {c.community_id}
                </p>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate" title={c.theme_name}>
                  {c.theme_name || `Thematic Cluster ${c.community_id}`}
                </h3>
              </div>
              <div className="ml-auto shrink-0 text-right">
                <span className="text-sm font-bold text-gray-900">
                  {c.size}
                </span>
                <p className="text-[10px] text-gray-400">verses</p>
              </div>
            </div>

            {/* Central verse */}
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 mb-4 italic">
              &ldquo;{c.central_verse_english}&rdquo;
            </p>

            {/* Stats */}
            <div className="flex gap-4 pt-3 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Density</p>
                <p className="text-sm font-semibold text-gray-900">
                  {(c.density * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Avg Similarity</p>
                <p className="text-sm font-semibold text-gray-900">
                  {(c.avg_similarity * 100).toFixed(1)}%
                </p>
              </div>
              <div className="ml-auto flex items-end">
                <svg
                  className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
