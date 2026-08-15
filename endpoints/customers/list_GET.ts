import superjson from "superjson";
import { db, sql } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { requireTenantPermission } from "../../helpers/tenantContext";
import type { OutputType } from "./list_GET.schema";

export async function handle(request: Request) {
    try {
        const user = await getServerUserSession(request);
        if (!user) {
            return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const url = new URL(request.url);
        const tenantId = Number(url.searchParams.get("tenantId"));
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
        const search = url.searchParams.get("search") || undefined;

        if (!tenantId || Number.isNaN(tenantId)) {
            return new Response(superjson.stringify({ error: "tenantId is required" }), { status: 400 });
        }

        await requireTenantPermission(user.id, tenantId, "customers.view");

        // Build query with optional search
        let query = db
            .selectFrom("customers")
            .leftJoin("orders", "orders.customerId", "customers.id")
            .select([
                "customers.id",
                "customers.name",
                "customers.email",
                "customers.phone",
                "customers.createdAt",
                sql<number>`COUNT(DISTINCT orders.id)`.as("totalOrders"),
                sql<string>`COALESCE(SUM(orders.total), 0)`.as("totalSpent"),
            ])
            .where("customers.tenantId", "=", tenantId)
            .groupBy([
                "customers.id",
                "customers.name",
                "customers.email",
                "customers.phone",
                "customers.createdAt",
            ]);

        // Apply search filter
        if (search) {
            query = query.where((eb) =>
                eb.or([
                    eb("customers.name", "ilike", `%${search}%`),
                    eb("customers.email", "ilike", `%${search}%`),
                    eb("customers.phone", "ilike", `%${search}%`),
                ])
            );
        }

        // Get total count
        const countQuery = db
            .selectFrom("customers")
            .select((eb) => eb.fn.count("id").as("count"))
            .where("customers.tenantId", "=", tenantId);

        const countResult = await countQuery.executeTakeFirstOrThrow();
        const total = Number(countResult.count);
        const totalPages = Math.ceil(total / limit);

        // Get paginated results
        const rows = await query
            .orderBy("customers.createdAt", "desc")
            .limit(limit)
            .offset((page - 1) * limit)
            .execute();

        const customers = rows.map((row) => ({
            id: row.id,
            name: row.name ?? "",
            email: row.email ?? "",
            phone: row.phone,
            totalOrders: Number(row.totalOrders),
            totalSpent: row.totalSpent.toString(),
            createdAt: row.createdAt,
        }));

        const result: OutputType = {
            customers,
            total,
            page,
            limit,
            totalPages,
        };

        return new Response(superjson.stringify(result));
    } catch (error) {
        console.error("customers list error:", error);
        const message = error instanceof Error ? error.message : "Failed to load customers";
        return new Response(superjson.stringify({ error: message }), { status: 400 });
    }
}
