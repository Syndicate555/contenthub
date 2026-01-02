import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, GetItemsParams, CreateItemPayload, UpdateItemPayload } from '../services/api';
import { Item, ItemsResponse, UserStats } from '../types';

// Query keys
export const itemsKeys = {
  all: ['items'] as const,
  lists: () => [...itemsKeys.all, 'list'] as const,
  list: (params: GetItemsParams) => [...itemsKeys.lists(), params] as const,
  details: () => [...itemsKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemsKeys.details(), id] as const,
};

export const userKeys = {
  all: ['user'] as const,
  stats: () => [...userKeys.all, 'stats'] as const,
};

// ==================== Queries ====================

export function useItems(params: GetItemsParams = {}, options?: { enabled?: boolean }) {
  const { getAuthToken } = require('../services/api');
  
  return useQuery({
    queryKey: itemsKeys.list(params),
    queryFn: async () => {
      // Check if we have a token before making the request
      const token = getAuthToken();
      if (!token) {
        console.log('[useItems] No auth token, returning empty data');
        return {
          ok: false,
          data: [],
          meta: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
        } as ItemsResponse;
      }
      
      try {
        console.log('[useItems] Fetching items with token');
        return await api.items.get(params);
      } catch (error: any) {
        console.error('[useItems] Error fetching items:', error.message);
        // Return empty data on error to prevent UI crash
        if (error.message === 'UNAUTHORIZED' || error.message === 'NOT_FOUND') {
          throw error; // Re-throw auth errors so UI can handle them
        }
        // For other errors, return empty data
        return {
          ok: false,
          data: [],
          meta: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
        } as ItemsResponse;
      }
    },
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.message === 'UNAUTHORIZED' || error?.message === 'NOT_FOUND') {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useItem(id: string | undefined) {
  const { data: itemsData } = useItems();
  
  // Find item from cached items list
  const item = itemsData?.data?.find(i => i.id === id);
  
  return {
    data: item,
    isLoading: false,
    isError: !item,
  };
}

export function useUserStats() {
  return useQuery({
    queryKey: userKeys.stats(),
    queryFn: async (): Promise<UserStats> => {
      // Return default stats since the endpoint doesn't exist on production
      return {
        totalXp: 0,
        currentStreak: 0,
        level: 1,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ==================== Mutations ====================

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateItemPayload) => api.items.create(payload),
    onSuccess: () => {
      // Invalidate and refetch items list
      queryClient.invalidateQueries({ queryKey: itemsKeys.lists() });
      // Also invalidate user stats
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
    },
    onError: (error: any) => {
      console.error('[useCreateItem] Error:', error.message);
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateItemPayload }) =>
      api.items.update(id, payload),
    onSuccess: (updatedItem) => {
      // Update the item in the cache
      if (updatedItem?.id) {
        queryClient.setQueryData(
          itemsKeys.detail(updatedItem.id),
          updatedItem
        );
      }
      // Invalidate lists to refresh
      queryClient.invalidateQueries({ queryKey: itemsKeys.lists() });
      // Invalidate user stats
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
    },
    onError: (error: any) => {
      console.error('[useUpdateItem] Error:', error.message);
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.items.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: itemsKeys.detail(deletedId) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: itemsKeys.lists() });
    },
    onError: (error: any) => {
      console.error('[useDeleteItem] Error:', error.message);
    },
  });
}
