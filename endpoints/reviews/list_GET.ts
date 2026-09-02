import { db, sql } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { tenantId } = await getServerUserSession(request);
    const url = new URL(request.url);
    const productId = parseInt(url.searchParams.get("productId") || "0", 10);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const status = url.searchParams.get("status") || "approved";

    if (!productId) {
      return new Response(superjson.stringify({ error: "Product ID is required" }), { status: 400 });
    }

    const offset = (page - 1) * limit;

    let query = db
      .selectFrom("productReviews")
      .innerJoin("users", "users.id", "productReviews.userId")
      .where("productReviews.productId", "=", productId)
      .where("productReviews.status", "=", status as any);

    if (tenantId) {
      query = query.where("productReviews.tenantId", "=", tenantId);
    }

    const countResult = await db
      .selectFrom("productReviews")
      .select(sql<number>`COUNT(*)`.as("count"))
      .where("productId", "=", productId)
      .where("status", "=", status as any)
      .executeTakeFirstOrThrow();

    const totalReviews = Number(countResult.count);

    const reviews = await query
      .select([
        "productReviews.id",
        "productReviews.rating",
        "productReviews.title",
        "productReviews.content",
        "productReviews.status",
        "productReviews.isVerifiedPurchase",
        "productReviews.helpfulCount",
        "productReviews.notHelpfulCount",
        "productReviews.merchantResponse",
        "productReviews.merchantResponseAt",
        "productReviews.createdAt",
        "users.displayName as userName",
        "users.avatarUrl",
      ])
      .limit(limit)
      .offset(offset)
      .orderBy("productReviews.createdAt", "desc")
      .execute();

    return new Response(
      superjson.stringify({
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          content: r.content,
          status: r.status,
          isVerifiedPurchase: r.isVerifiedPurchase,
          helpfulCount: r.helpfulCount,
          notHelpfulCount: r.notHelpfulCount,
          merchantResponse: r.merchantResponse,
          merchantResponseAt: r.merchantResponseAt,
          createdAt: r.createdAt,
          user: {
            name: r.userName || "Anonymous",
            avatarUrl: r.avatarUrl,
          },
        })),
        totalReviews,
        page,
        totalPages: Math.ceil(totalReviews / limit),
      })
    );
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return new Response(superjson.stringify({ error: error.message || "Failed to fetch reviews" }), { status: 400 });
  }
}
