import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient';

export interface StoreStatus {
  id: number;
  name: string;
  slug: string;
  published: boolean;
  publish_date: string | null;
  unpublish_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublishRequest {
  storeId: number;
}

export interface UnpublishRequest {
  storeId: number;
  reason?: string;
}

/**
 * Get store publishing status
 */
export function useStoreStatus(storeId?: number) {
  return useQuery({
    queryKey: ['store-status', storeId],
    queryFn: () =>
      apiClient.get<StoreStatus>('/stores/status', {
        params: storeId ? { storeId: storeId.toString() } : {},
      }),
    staleTime: 30000, // 30 seconds
    enabled: !!storeId,
  });
}

/**
 * Publish a store
 */
export function usePublishStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PublishRequest) =>
      apiClient.post<{ success: boolean; store: StoreStatus; message: string }>(
        '/stores/publish',
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-status'] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
    },
  });
}

/**
 * Unpublish a store
 */
export function useUnpublishStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UnpublishRequest) =>
      apiClient.post<{ success: boolean; store: StoreStatus; message: string }>(
        '/stores/unpublish',
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-status'] });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
    },
  });
}

/**
 * Check if store meets publishing requirements
 */
export function usePublishRequirements(storeId: number) {
  return useQuery({
    queryKey: ['publish-requirements', storeId],
    queryFn: async () => {
      const [products, categories] = await Promise.all([
        apiClient.get<any[]>('/products/list', {
          params: { storeId: storeId.toString(), limit: '1' },
        }),
        apiClient.get<any[]>('/categories/list', {
          params: { storeId: storeId.toString() },
        }),
      ]);

      return {
        hasProducts: products.length > 0,
        hasCategories: categories.length > 0,
        canPublish: products.length > 0 && categories.length > 0,
      };
    },
    staleTime: 60000, // 1 minute
    enabled: !!storeId,
  });
}
