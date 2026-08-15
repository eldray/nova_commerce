import superjson from "superjson";
import { schema, OutputType, WishlistItem } from "./list_GET.schema";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { getTenantIdFromSession } from "../../helpers/tenantContext";

export async function handle(request: Request) {
  try {
    const session = await getServerUserSession(request);
    if (!session) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const tenantResult = await getTenantIdFromSession(request);
    if (!tenantResult.success || !tenantResult.tenantId) {
      return new Response(superjson.stringify({ error: "Tenant not found" }), { status: 404 });
    }
    const tenantId = tenantResult.tenantId;
    const userId = session.user.id;

    // Find customer by user email
    const customer = await db
      .selectFrom("customers")
      .select(["id"])
      .where("email", "=", session.user.email)
      .where("tenant_id", "=", tenantId)
      .executeTakeFirst();

    if (!customer) {
      return new Response(superjson.stringify({ items: [], total: 0, page: 1, limit: 20, hasMore: false } satisfies OutputType), {
        status: 200,
      });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await db
      .selectFrom("wishlists")
      .select((eb) => eb.fn.count("id").as("count"))
      .where("tenant_id", "=", tenantId)
      .where("customer_id", "=", customer.id)
      .executeTakeFirstOrThrow();

    const total = Number(countResult.count);

    // Get wishlist items with product details
    const items = await db
      .selectFrom("wishlists as w")
      .innerJoin("products as p", "p.id", "w.product_id")
      .leftJoin("product_images as pi", (join) =>
        join.onRef("pi.product_id", "=", "p.id").on("pi.is_primary", "=", true)
      )
      .select([
        "w.id",
        "w.product_id",
        "p.name as productName",
        "p.slug as productSlug",
        "p.price",
        "p.currency",
        "p.stock_quantity",
        "p.compare_at_price",
        "pi.image_url as productImageUrl",
        "w.created_at as addedAt",
      ])
      .where("w.tenant_id", "=", tenantId)
      .where("w.customer_id", "=", customer.id)
      .orderBy("w.created_at desc")
      .limit(limit)
      .offset(offset)
      .execute();

    const wishlistItems: WishlistItem[] = items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.productName,
      productSlug: item.productSlug,
      productImageUrl: item.productImageUrl,
      price: Number(item.price),
      currency: item.currency || "GHS",
      inStock: (item.stock_quantity || 0) > 0,
      addedAt: item.addedAt.toISOString(),
      compareAtPrice: item.compare_at_price ? Number(item.compare_at_price) : null,
    }));

    return new Response(
      superjson.stringify({
        items: wishlistItems,
        total,
        page,
        limit,
        hasMore: offset + items.length < total,
      } satisfies OutputType),
      { status: 200 }
    );
  } catch (error) {
    console.error("wishlist list error:", error);
    const message = error instanceof Error ? error.message : "Failed to load wishlist";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}
