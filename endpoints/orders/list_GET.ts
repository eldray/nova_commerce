import superjson from "superjson";
import { OutputType } from "./list_GET.schema";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { requireTenantPermission } from "../../helpers/tenantContext";
import { sql } from "kysely";

export async function handle(request: Request) {
    try {
        const user = await getServerUserSession(request);
        if (!user) {
            return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
        }
        const url = new URL(request.url);
        const tenantId = Number(url.searchParams.get("tenantId"));
        if (!tenantId || Number.isNaN(tenantId)) {
            return new Response(superjson.stringify({ error: "tenantId is required" }), { status: 400 });
        }

        await requireTenantPermission(user.id, tenantId, "orders.view");

        const rows = await db
            .selectFrom("orders")
            .leftJoin("orderItems", "orderItems.orderId", "orders.id")
            .select([
                "orders.id",
                "orders.orderNumber",
                "orders.status",
                "orders.paymentStatus",
                "orders.total",
                "orders.currency",
                "orders.recipientName",
                "orders.createdAt",
                sql<number>`count(order_items.id)`.as("itemCount"),
            ])
            .where("orders.tenantId", "=", tenantId)
            .groupBy([
                "orders.id",
                "orders.orderNumber",
                "orders.status",
                "orders.paymentStatus",
                "orders.total",
                "orders.currency",
                "orders.recipientName",
                "orders.createdAt",
            ])
            .orderBy("orders.createdAt", "desc")
            .execute();

        const orders = rows.map((row) => ({
            id: row.id,
            orderNumber: row.orderNumber,
            status: row.status,
            paymentStatus: row.paymentStatus,
            total: row.total,
            currency: row.currency,
            recipientName: row.recipientName,
            itemCount: Number(row.itemCount),
            createdAt: row.createdAt,
        }));

        return new Response(superjson.stringify({ orders } satisfies OutputType));
    } catch (error) {
        console.error("orders list error:", error);
        const message = error instanceof Error ? error.message : "Failed to load orders";
        return new Response(superjson.stringify({ error: message }), { status: 400 });
    }
}