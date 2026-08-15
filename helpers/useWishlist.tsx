import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWishlist, WishlistItem } from "../endpoints/wishlist/list_GET.schema";
import { toggleWishlistItem } from "../endpoints/wishlist/toggle_POST.schema";

export function useWishlist() {
  return useQuery({
    queryKey: ["wishlist"],
    queryFn: () => getWishlist({ page: 1, limit: 50 }),
    staleTime: 30000, // 30 seconds
  });
}

export function useToggleWishlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => toggleWishlistItem({ productId }),
    onSuccess: () => {
      // Invalidate wishlist query to refetch
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

export function useIsInWishlist(productId: string) {
  const { data } = useWishlist();
  
  if (!data?.items) return false;
  
  return data.items.some((item: WishlistItem) => item.productId === productId);
}
