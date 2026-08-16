import { getDb } from "../../../helpers/db";
import type { Context } from "../../../helpers/context";
import type { InputType, OutputType } from "./moderate_POST.schema";

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
    throw new Error("User ID is required");
  }

  // Verify review exists and belongs to tenant
  const review = await db
    .selectFrom("product_reviews")
    .where("id", "=", input.reviewId)
    .where("tenantId", "=", tenantId)
    .selectAll()
    .executeTakeFirst();

  if (!review) {
    throw new Error("Review not found");
  }

  // Update the review
  const result = await db
    .updateTable("product_reviews")
    .set({
      status: input.status,
      merchantResponse: input.merchantResponse || null,
      merchantResponseAt: input.merchantResponse ? new Date() : null,
      respondedByUserId: input.merchantResponse ? userId : null,
      updatedAt: new Date(),
    })
    .where("id", "=", input.reviewId)
    .returning(["id", "status", "merchantResponse", "merchantResponseAt"])
    .executeTakeFirstOrThrow();

  return {
    id: result.id,
    status: result.status as "pending" | "approved" | "rejected",
    merchantResponse: result.merchantResponse,
    merchantResponseAt: result.merchantResponseAt,
  };
}
