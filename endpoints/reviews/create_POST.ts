import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import superjson from "superjson";
import { schema } from "./create_POST.schema";

export async function handle(request: Request) {
  try {
    const { user, tenantId } = await getServerUserSession(request);
    if (!user || !tenantId) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const product = await db
      .selectFrom("products")
      .where("id", "=", input.productId)
      .where("tenantId", "=", tenantId)
      .select(["id", "name"])
      .executeTakeFirst();

    if (!product) {
      return new Response(superjson.stringify({ error: "Product not found" }), { status: 404 });
    }

    const existingReview = await db
      .selectFrom("productReviews")
      .where("productId", "=", input.productId)
      .where("userId", "=", user.id)
      .select("id")
      .executeTakeFirst();

    if (existingReview) {
      return new Response(superjson.stringify({ error: "You have already reviewed this product" }), { status: 400 });
    }

    let isVerifiedPurchase = false;
    if (input.orderId) {
      const order = await db
        .selectFrom("orders")
        .where("id", "=", input.orderId)
        .where("tenantId", "=", tenantId)
        .select("id")
        .executeTakeFirst();

      if (order) {
        const orderItem = await db
          .selectFrom("orderItems")
          .where("orderId", "=", input.orderId)
          .where("productId", "=", input.productId)
          .select("id")
          .executeTakeFirst();

        if (orderItem) {
          isVerifiedPurchase = true;
        }
      }
    }

    const result = await db
      .insertInto("productReviews")
      .values({
        tenantId,
        productId: input.productId,
        userId: user.id,
        orderId: input.orderId || null,
        rating: input.rating,
        title: input.title || null,
        content: input.content,
        status: "pending",
        isVerifiedPurchase,
        helpfulCount: 0,
        notHelpfulCount: 0,
        images: input.images || [],
      })
      .returning(["id", "status", "isVerifiedPurchase"])
      .executeTakeFirstOrThrow();

    return new Response(
      superjson.stringify({
        id: result.id,
        status: result.status,
        isVerifiedPurchase: result.isVerifiedPurchase,
      })
    );
  } catch (error: any) {
    console.error("Error creating review:", error);
    return new Response(superjson.stringify({ error: error.message || "Failed to create review" }), { status: 400 });
  }
}
