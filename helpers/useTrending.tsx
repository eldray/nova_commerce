import { useQuery } from '@tanstack/react-query';
import { getTrendingProducts, TrendingProduct } from '../endpoints/analytics/trending_GET.schema';

export function useTrendingProducts(limit?: number, category?: string) {
  return useQuery<TrendingProduct[]>({
    queryKey: ['trending-products', limit, category],
    queryFn: () => getTrendingProducts({
      limit: limit || 8,
      category
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
