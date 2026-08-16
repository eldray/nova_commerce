import { getDb } from "../../../helpers/db";
import type { Context } from "../../../helpers/context";
import type { InputType, OutputType } from "./create_POST.schema";

export async function handler(
  input: InputType,
  context: Context
): Promise<OutputType> {
  const db = await getDb();
  const { tenantId, userId } = context;

  if (!tenantId) {
    throw new Error("Tenant ID is required");
  }

  if (!userId) {
    throw new Error("You must be logged in to submit a review");
  }

  // Verify product exists and belongs to tenant
  const product = await db
    .selectFrom("products")
    .where("id", "=", input.productId)
    .where("tenantId", "=", tenantId)
    .select(["id", "name"])
    .executeTakeFirst();

  if (!product) {
    throw new Error("Product not found");
  }

  // Check if user already reviewed this product
  const existingReview = await db
    .selectFrom("product_reviews")
    .where("productId", "=", input.productId)
    .where("userId", "=", userId)
    .select("id")
    .executeTakeFirst();

  if (existingReview) {
    throw new Error("You have already reviewed this product");
  }

  // Check if this is a verified purchase (user bought this product)
  let isVerifiedPurchase = false;
  if (input.orderId) {
    const order = await db
      .selectFrom("orders")
      .where("id", "=", input.orderId)
      .where("userId", "=", userId)
      .where("status", "in", ["completed", "delivered"] as any)
      .select("id")
      .executeTakeFirst();

    if (order) {
      // Check if the order contains this product
      const orderItem = await db
        .selectFrom("order_items")
        .where("orderId", "=", input.orderId)
        .where("productId", "=", input.productId)
        .select("id")
        .executeTakeFirst();

      if (orderItem) {
        isVerifiedPurchase = true;
      }
    }
  } else {
    // Check if user has any completed orders with this product
    const verifiedOrder = await db
      .selectFrom("orders")
      .innerJoin("order_items", "order_items.orderId", "orders.id")
      .where("orders.userId", "=", userId)
      .where("order_items.productId", "=", input.productId)
      .where("orders.status", "in", ["completed", "delivered"] as any)
      .select("orders.id")
      .executeTakeFirst();

    if (verifiedOrder) {
      isVerifiedPurchase = true;
    }
  }

  // Create the review
  const result = await db
    .insertInto("product_reviews")
    .values({
      tenantId,
      productId: input.productId,
      userId,
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

  return {
    id: result.id,
    status: result.status as "pending" | "approved" | "rejected",
    isVerifiedPurchase: result.isVerifiedPurchase,
  };
}
