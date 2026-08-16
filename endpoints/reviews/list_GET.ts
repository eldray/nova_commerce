import { getDb } from "../../../helpers/db";
import type { Context } from "../../../helpers/context";
import type { InputType, OutputType } from "./list_GET.schema";

export async function handler(
  input: InputType,
  context: Context
): Promise<OutputType> {
  const db = await getDb();
  const { tenantId } = context;

  if (!tenantId) {
    throw new Error("Tenant ID is required");
  }

  const offset = (input.page - 1) * input.limit;

  // Build base query
  let query = db
    .selectFrom("product_reviews")
    .innerJoin("users", "users.id", "product_reviews.userId")
    .where("product_reviews.tenantId", "=", tenantId)
    .where("product_reviews.productId", "=", input.productId)
    .where("product_reviews.status", "=", input.status);

  // Apply filters
  if (input.rating) {
    query = query.where("product_reviews.rating", "=", input.rating);
  }

  if (input.verifiedOnly) {
    query = query.where("product_reviews.isVerifiedPurchase", "=", true);
  }

  // Get total count
  const countQuery = query.select(db.fn.count("product_reviews.id").as("count"));
  const countResult = await countQuery.executeTakeFirstOrThrow();
  const totalReviews = Number(countResult.count);

  // Apply sorting
  switch (input.sortBy) {
    case "newest":
      query = query.orderBy("product_reviews.createdAt", "desc");
      break;
    case "oldest":
      query = query.orderBy("product_reviews.createdAt", "asc");
      break;
    case "highest":
      query = query.orderBy("product_reviews.rating", "desc");
      break;
    case "lowest":
      query = query.orderBy("product_reviews.rating", "asc");
      break;
    case "helpful":
      query = query.orderBy("product_reviews.helpfulCount", "desc");
      break;
  }

  // Get paginated reviews
  const reviews = await query
    .select([
      "product_reviews.id",
      "product_reviews.rating",
      "product_reviews.title",
      "product_reviews.content",
      "product_reviews.status",
      "product_reviews.isVerifiedPurchase",
      "product_reviews.helpfulCount",
      "product_reviews.notHelpfulCount",
      "product_reviews.merchantResponse",
      "product_reviews.merchantResponseAt",
      "product_reviews.createdAt",
      "users.name as userName",
      "users.avatarUrl",
    ])
    .limit(input.limit)
    .offset(offset)
    .execute();

  // Calculate average rating and distribution
  const stats = await db
    .selectFrom("product_reviews")
    .where("tenantId", "=", tenantId)
    .where("productId", "=", input.productId)
    .where("status", "=", "approved")
    .select([
      db.fn.avg("rating").as("averageRating"),
      db.fn.sum(db.case().when(db.ref("rating"), "=", 5).then(1).else(0).end()).as("count5"),
      db.fn.sum(db.case().when(db.ref("rating"), "=", 4).then(1).else(0).end()).as("count4"),
      db.fn.sum(db.case().when(db.ref("rating"), "=", 3).then(1).else(0).end()).as("count3"),
      db.fn.sum(db.case().when(db.ref("rating"), "=", 2).then(1).else(0).end()).as("count2"),
      db.fn.sum(db.case().when(db.ref("rating"), "=", 1).then(1).else(0).end()).as("count1"),
    ])
    .executeTakeFirstOrThrow();

  const averageRating = stats.averageRating ? parseFloat(stats.averageRating as string) : 0;
  const ratingDistribution = {
    5: Number(stats.count5 || 0),
    4: Number(stats.count4 || 0),
    3: Number(stats.count3 || 0),
    2: Number(stats.count2 || 0),
    1: Number(stats.count1 || 0),
  };

  return {
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      content: r.content,
      status: r.status as "pending" | "approved" | "rejected",
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
    averageRating: Math.round(averageRating * 100) / 100,
    totalReviews,
    ratingDistribution,
    page: input.page,
    totalPages: Math.ceil(totalReviews / input.limit),
  };
}
