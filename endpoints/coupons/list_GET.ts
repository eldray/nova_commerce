import { db, sql } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user, tenantId } = await getServerUserSession(request);
    if (!user || !tenantId) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    const offset = (page - 1) * limit;

    let query = db
      .selectFrom("coupons")
      .where("tenantId", "=", tenantId)
      .selectAll();

    if (status) {
      query = query.where("status", "=", status as any);
    }

    if (search) {
      query = query.where((eb) =>
        eb.or([
          eb("code", "ilike", `%${search}%`),
          eb("name", "ilike", `%${search}%`),
        ])
      );
    }

    const countResult = await db
      .selectFrom("coupons")
      .select(sql<number>`COUNT(*)`.as("count"))
      .where("tenantId", "=", tenantId)
      .executeTakeFirstOrThrow();

    const total = Number(countResult.count);

    const coupons = await query
      .orderBy("createdAt", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    return new Response(
      superjson.stringify({
        coupons: coupons.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          description: c.description,
          type: c.type,
          value: c.value,
          minPurchaseAmount: c.minPurchaseAmount,
          maxDiscountAmount: c.maxDiscountAmount,
          usageLimit: c.usageLimit,
          usageLimitPerUser: c.usageLimitPerUser,
          usedCount: c.usedCount,
          status: c.status,
          startsAt: c.startsAt,
          expiresAt: c.expiresAt,
          firstOrderOnly: c.firstOrderOnly,
          createdAt: c.createdAt,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      })
    );
  } catch (error: any) {
    console.error("Error listing coupons:", error);
    return new Response(superjson.stringify({ error: error.message || "Failed to list coupons" }), { status: 400 });
  }
}
