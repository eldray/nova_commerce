import { requireAdmin } from "../../middleware/auth";
import { db, sql } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    await requireAdmin(request);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;
    const statusFilter = url.searchParams.get("status");

    let countQuery = db
      .selectFrom("customDomains")
      .select(sql<number>`COUNT(*)`.as("count"));

    let listQuery = db
      .selectFrom("customDomains")
      .selectAll();

    if (statusFilter) {
      countQuery = countQuery.where("status", "=", statusFilter);
      listQuery = listQuery.where("status", "=", statusFilter);
    }

    const totalResult = await countQuery.executeTakeFirst();
    const count = Number(totalResult?.count || 0);

    const domains = await listQuery
      .orderBy("createdAt", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    return new Response(
      superjson.stringify({
        success: true,
        domains,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
        },
      })
    );
  } catch (error: any) {
    console.error("Error fetching admin domains:", error);
    return new Response(
      superjson.stringify({
        success: false,
        error: error.message || "Failed to fetch domains",
      }),
      { status: error.cause?.status || 500 }
    );
  }
}
