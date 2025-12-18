import useSWR from "swr";

interface Tag {
  id: string;
  displayName: string;
  usageCount: number;
  createdAt: string;
}

interface TagsResponse {
  ok: boolean;
  data: Tag[];
  meta: {
    total: number;
    sortBy: string;
  };
}

/**
 * Hook to fetch tags from the API
 *
 * @param limit - Maximum number of tags to fetch (default: 100)
 * @param sortBy - Sort order: "usage" | "alphabetical" | "recent" (default: "usage")
 * @returns SWR response with tags data
 *
 * @example
 * const { tags, isLoading, error } = useTags(50, "usage")
 */
export function useTags(
  limit: number = 100,
  sortBy: "usage" | "alphabetical" | "recent" = "usage",
) {
  const { data, error, isLoading, mutate } = useSWR<TagsResponse>(
    `/api/tags?limit=${limit}&sortBy=${sortBy}`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch tags");
      return res.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    tags: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}
