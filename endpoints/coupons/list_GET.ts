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

  // Build query with filters
  let query = db
    .selectFrom("coupons")
    .where("tenantId", "=", tenantId)
    .selectAll();

  // Apply status filter
  if (input.status) {
    query = query.where("status", "=", input.status);
  }

  // Apply search filter
  if (input.search) {
    query = query.where((eb) =>
      eb.or([
        eb("code", "ilike", `%${input.search}%`),
        eb("name", "ilike", `%${input.search}%`),
      ])
    );
  }

  // Get total count
  const countQuery = query.as<"count">().select(db.fn.count("id").as("count"));
  const countResult = await countQuery.executeTakeFirstOrThrow();
  const total = Number(countResult.count);

  // Get paginated results
  const coupons = await query
    .orderBy("createdAt", "desc")
    .limit(input.limit)
    .offset(offset)
    .execute();

  return {
    coupons: coupons.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      type: c.type as "percentage" | "fixed_amount" | "free_shipping",
      value: c.value,
      minPurchaseAmount: c.minPurchaseAmount,
      maxDiscountAmount: c.maxDiscountAmount,
      usageLimit: c.usageLimit,
      usageLimitPerUser: c.usageLimitPerUser,
      usedCount: c.usedCount,
      status: c.status as "active" | "inactive" | "expired",
      startsAt: c.startsAt,
      expiresAt: c.expiresAt,
      firstOrderOnly: c.firstOrderOnly,
      createdAt: c.createdAt,
    })),
    total,
    page: input.page,
    totalPages: Math.ceil(total / input.limit),
  };
}
