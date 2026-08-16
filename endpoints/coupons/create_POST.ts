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

  // Check if coupon code already exists for this tenant
  const existingCoupon = await db
    .selectFrom("coupons")
    .where("tenantId", "=", tenantId)
    .where("code", "=", input.code.toUpperCase())
    .select("id")
    .executeTakeFirst();

  if (existingCoupon) {
    throw new Error(`Coupon code "${input.code}" already exists`);
  }

  // Validate dates
  const startsAt = input.startsAt ? new Date(input.startsAt) : new Date();
  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

  if (expiresAt && startsAt >= expiresAt) {
    throw new Error("Start date must be before expiration date");
  }

  // Determine initial status based on dates
  let status = input.status;
  const now = new Date();
  if (expiresAt && expiresAt < now) {
    status = "expired" as const;
  } else if (startsAt > now) {
    status = "inactive" as const;
  }

  const result = await db
    .insertInto("coupons")
    .values({
      tenantId,
      code: input.code.toUpperCase(),
      name: input.name,
      description: input.description || null,
      type: input.type,
      value: input.value.toString(),
      minPurchaseAmount: input.minPurchaseAmount?.toString() || null,
      maxDiscountAmount: input.maxDiscountAmount?.toString() || null,
      usageLimit: input.usageLimit || null,
      usageLimitPerUser: input.usageLimitPerUser || null,
      usedCount: 0,
      status,
      startsAt,
      expiresAt,
      applicableProductIds: input.applicableProductIds,
      applicableCategoryIds: input.applicableCategoryIds,
      firstOrderOnly: input.firstOrderOnly,
      createdByUserId: userId || null,
    })
    .returning(["id", "code"])
    .executeTakeFirstOrThrow();

  return {
    id: result.id,
    code: result.code,
  };
}
