import superjson from "superjson";
import { z } from "zod";
import { db } from "../../helpers/db";

const QuerySchema = z.object({
  limit: z.string().transform((val) => parseInt(val, 10)).optional().default("8"),
  category: z.string().optional(),
});

export type OutputType = Array<{
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
}>;

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const input = QuerySchema.parse(Object.fromEntries(url.searchParams));

    // Get trending products based on views and sales
    const trendingProducts = await db
      .selectFrom("products as p")
      .leftJoin("categories as c", "c.id", "p.category_id")
      .leftJoin("product_images as pi", (join) =>
        join.onRef("pi.product_id", "=", "p.id").on("pi.position", "=", 0)
      )
      .select([
        "p.id",
        "p.name",
        "p.slug",
        "p.price",
        "p.sale_price",
        "pi.url as image_url",
        "c.name as category_name",
        "p.stock_quantity",
      ])
      .where("p.status", "=", "active")
      .orderBy("p.created_at", "desc")
      .limit(input.limit)
      .execute();

    // For each product, calculate trending score (views + sales)
    // In a real implementation, you'd have a product_views table
    const productsWithTrending = await Promise.all(
      trendingProducts.map(async (product) => {
        // Get order items count for this product
        const orderStats = await db
          .selectFrom("order_items as oi")
          .innerJoin("orders as o", "o.id", "oi.order_id")
          .select([
            db.fn.sum("oi.quantity").as("total_sold"),
            db.fn.count("oi.id").as("order_count"),
          ])
          .where("oi.product_id", "=", product.id)
          .where("o.status", "in", ["paid", "processing", "shipped", "delivered"] as any)
          .executeTakeFirst();

        // Simulate view count (in production, track this in analytics)
        const viewCount = Math.floor(Math.random() * 500) + 100;
        const totalSold = Number(orderStats?.total_sold || 0);
        
        // Calculate trending score
        const trendingScore = (viewCount * 0.3) + (totalSold * 10);

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: Number(product.price),
          sale_price: product.sale_price ? Number(product.sale_price) : null,
          image_url: product.image_url,
          trending_score: Math.round(trendingScore),
          view_count: viewCount,
          category_name: product.category_name,
          total_sold,
        };
      })
    );

    // Sort by trending score
    productsWithTrending.sort((a, b) => b.trending_score - a.trending_score);

    return new Response(superjson.stringify(productsWithTrending.slice(0, input.limit)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("trending products error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch trending products";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}
