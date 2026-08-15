import { useQuery } from '@tanstack/react-query';
import { apiClient } from './api';

export interface TrendingProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  image_url: string | null;
  trending_score: number;
  view_count: number;
  category_name: string | null;
  total_sold: number;
}

export function useTrendingProducts(limit?: number, category?: string) {
  return useQuery<TrendingProduct[]>({
    queryKey: ['trending-products', limit, category],
    queryFn: () => apiClient.get('/analytics/trending', {
      params: { limit: limit || 8, category }
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
