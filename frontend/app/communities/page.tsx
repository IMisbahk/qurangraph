import type { Metadata } from "next";
import { api } from "@/lib/api";
import CommunityList from "@/components/community/CommunityList";

export const metadata: Metadata = {
  title: "Communities — QuranGraph",
  description:
    "Explore thematic communities automatically discovered through Louvain community detection across all 6,236 Quran verses.",
};

async function getCommunities() {
  try {
    return await api.getCommunities();
  } catch {
    return [];
  }
}

export default async function CommunitiesPage() {
  const communities = await getCommunities();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Thematic Communities
        </h1>
        <p className="text-gray-500 max-w-2xl">
          These {communities.length} communities were automatically discovered by the Louvain
          algorithm — grouping verses that are semantically close to each other.
          Each community represents a distinct thematic cluster in the Quran.
        </p>
      </div>

      <CommunityList communities={communities} />
    </div>
  );
}
