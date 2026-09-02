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

    const existingCoupon = await db
      .selectFrom("coupons")
      .where("tenantId", "=", tenantId)
      .where("code", "=", input.code.toUpperCase())
      .select("id")
      .executeTakeFirst();

    if (existingCoupon) {
      return new Response(superjson.stringify({ error: `Coupon code "${input.code}" already exists` }), { status: 400 });
    }

    const startsAt = input.startsAt ? new Date(input.startsAt) : new Date();
    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

    if (expiresAt && startsAt >= expiresAt) {
      return new Response(superjson.stringify({ error: "Start date must be before expiration date" }), { status: 400 });
    }

    let status = input.status;
    const now = new Date();
    if (expiresAt && expiresAt < now) {
      status = "expired";
    } else if (startsAt > now) {
      status = "inactive";
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
        createdByUserId: user.id,
      })
      .returning(["id", "code"])
      .executeTakeFirstOrThrow();

    return new Response(
      superjson.stringify({
        id: result.id,
        code: result.code,
      })
    );
  } catch (error: any) {
    console.error("Error creating coupon:", error);
    return new Response(superjson.stringify({ error: error.message || "Failed to create coupon" }), { status: 400 });
  }
}
