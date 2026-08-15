import { z } from "zod";

export const schema = z.object({
  limit: z.number().int().min(1).max(50).optional().default(8),
  category: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type TrendingProduct = {
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
};

export type OutputType = TrendingProduct[];

export const getTrendingProducts = async (
  input: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", input.limit.toString());
  if (input.category) {
    searchParams.set("category", input.category);
  }

  const result = await fetch(`/_api/analytics/trending?${searchParams}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!result.ok) {
    const errorObject = JSON.parse(await result.text());
    throw new Error(errorObject.error || "Failed to fetch trending products");
  }
  return result.json();
};
