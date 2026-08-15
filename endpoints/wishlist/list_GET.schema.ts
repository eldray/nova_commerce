import superjson from "superjson";
import { z } from "zod";

export const schema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export type InputType = z.infer<typeof schema>;

export type WishlistItem = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImageUrl: string | null;
  price: number;
  currency: string;
  inStock: boolean;
  addedAt: string;
  compareAtPrice?: number | null;
};

export type OutputType = {
  items: WishlistItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export const getWishlist = async (
  input: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.set("page", input.page.toString());
  searchParams.set("limit", input.limit.toString());
  
  const result = await fetch(`/_api/wishlist/list?${searchParams}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};
