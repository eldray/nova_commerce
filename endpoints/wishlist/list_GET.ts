import superjson from "superjson";
import { OutputType, WishlistItem } from "./list_GET.schema";
import { db, sql } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";

export async function handle(request: Request) {
  try {
    const userSession = await getServerUserSession(request);
    if (!userSession || !userSession.user) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { user, tenantId } = userSession;

    if (!tenantId) {
      return new Response(superjson.stringify({ error: "Tenant not found" }), { status: 404 });
    }

    const customer = await db
      .selectFrom("customers")
      .select(["id"])
      .where("email", "=", user.email)
      .where("tenantId", "=", tenantId)
      .executeTakeFirst();

    if (!customer) {
      return new Response(
        superjson.stringify({ items: [], total: 0, page: 1, limit: 20, hasMore: false } satisfies OutputType),
        { status: 200 }
      );
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 50);
    const offset = (page - 1) * limit;

    const countResult = await db
      .selectFrom("wishlists")
      .select(sql<number>`COUNT(*)`.as("count"))
      .where("tenantId", "=", tenantId)
      .where("customerId", "=", customer.id)
      .executeTakeFirstOrThrow();

    const total = Number(countResult.count);

    const items = await db
      .selectFrom("wishlists as w")
      .innerJoin("products as p", "p.id", "w.productId")
      .leftJoin("productImages as pi", "pi.productId", "p.id")
      .select([
        "w.id",
        "w.productId",
        "p.name as productName",
        "p.slug as productSlug",
        "p.price",
        "p.salePrice",
        "p.stockQuantity",
        "p.status as productStatus",
        "pi.url as primaryImage",
        "w.createdAt",
      ])
      .where("w.tenantId", "=", tenantId)
      .where("w.customerId", "=", customer.id)
      .orderBy("w.createdAt", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    const formattedItems: WishlistItem[] = items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productSlug: item.productSlug,
      price: String(item.price),
      salePrice: item.salePrice ? String(item.salePrice) : null,
      primaryImage: item.primaryImage || null,
      inStock: item.stockQuantity > 0,
      productStatus: item.productStatus,
      createdAt: new Date(item.createdAt),
    }));

    return new Response(
      superjson.stringify({
        items: formattedItems,
        total,
        page,
        limit,
        hasMore: offset + items.length < total,
      } satisfies OutputType),
      { status: 200 }
    );
  } catch (error) {
    console.error("wishlist/list error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch wishlist";
    return new Response(superjson.stringify({ error: message }), { status: 500 });
  }
}
