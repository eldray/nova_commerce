import superjson from "superjson";
import { z } from "zod";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { requireTenantPermission } from "../../helpers/tenantContext";
import { sql } from "kysely";

const QuerySchema = z.object({
    tenantId: z.string().transform((val) => parseInt(val, 10)),
    period: z.enum(["7d", "30d", "90d", "1y"]).optional().default("30d"),
});

export type OutputType = {
    metrics: {
        totalRevenue: string;
        totalOrders: number;
        totalCustomers: number;
        averageOrderValue: string;
        pendingOrders: number;
        completedOrders: number;
    };
    revenueByDay: Array<{
        date: string;
        revenue: string;
        orders: number;
    }>;
    topProducts: Array<{
        productId: number;
        productName: string;
        productSlug: string;
        quantitySold: number;
        revenue: string;
    }>;
    recentOrders: Array<{
        id: number;
        orderNumber: string;
        customerName: string;
        total: string;
        status: string;
        createdAt: Date;
    }>;
};

export async function handle(request: Request) {
    try {
        const user = await getServerUserSession(request);
        if (!user) {
            return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const url = new URL(request.url);
        const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) {
            return new Response(
                superjson.stringify({ error: "Invalid query parameters", details: parsed.error.flatten() }),
                { status: 400 }
            );
        }

        const { tenantId, period } = parsed.data;
        await requireTenantPermission(user.id, tenantId, "analytics.view");

        // Calculate date range
        const now = new Date();
        let daysAgo = 30;
        if (period === "7d") daysAgo = 7;
        else if (period === "90d") daysAgo = 90;
        else if (period === "1y") daysAgo = 365;

        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - daysAgo);

        // Get total revenue and order count for the period
        const revenueResult = await db
            .selectFrom("orders")
            .select([
                sql<string>`sum(total)`.as("totalRevenue"),
                sql<number>`count(*)`.as("totalOrders"),
                sql<number>`count(distinct customerId)`.as("totalCustomers"),
                sql<number>`avg(total)`.as("averageOrderValue"),
            ])
            .where("tenantId", "=", tenantId)
            .where("createdAt", ">=", startDate)
            .executeTakeFirst();

        // Get pending and completed orders
        const statusCounts = await db
            .selectFrom("orders")
            .select(["status"])
            .select((eb) => eb.fn.countAll().as("count"))
            .where("tenantId", "=", tenantId)
            .groupBy("status")
            .execute();

        const pendingOrders = statusCounts.find((s) => s.status === "pending")?.count ?? 0;
        const completedOrders = statusCounts.find((s) => s.status === "delivered")?.count ?? 0;

        // Get revenue by day for the chart
        const revenueByDayResult = await db
            .selectFrom("orders")
            .select([
                sql<string>`date("createdAt")`.as("date"),
                sql<string>`sum(total)`.as("revenue"),
                sql<number>`count(*)`.as("orders"),
            ])
            .where("tenantId", "=", tenantId)
            .where("createdAt", ">=", startDate)
            .groupBy(sql`date("createdAt")`)
            .orderBy(sql`date("createdAt")`, "asc")
            .execute();

        // Get top products by quantity sold
        const topProductsResult = await db
            .selectFrom("orderItems")
            .leftJoin("products", "products.id", "orderItems.productId")
            .select([
                "orderItems.productId as productId",
                "orderItems.productName as productName",
                sql<string>`coalesce(products.slug, '')`.as("productSlug"),
                sql<number>`sum(orderItems.quantity)`.as("quantitySold"),
                sql<string>`sum(orderItems.total)`.as("revenue"),
            ])
            .innerJoin("orders", "orders.id", "orderItems.orderId")
            .where("orders.tenantId", "=", tenantId)
            .where("orders.createdAt", ">=", startDate)
            .groupBy(["orderItems.productId", "orderItems.productName", sql`products.slug`])
            .orderBy(sql`sum(orderItems.quantity)`, "desc")
            .limit(5)
            .execute();

        // Get recent orders
        const recentOrdersResult = await db
            .selectFrom("orders")
            .leftJoin("customers", "customers.id", "orders.customerId")
            .select([
                "orders.id",
                "orders.orderNumber",
                sql<string>`coalesce(customers.name, orders.recipientName)`.as("customerName"),
                "orders.total",
                "orders.status",
                "orders.createdAt",
            ])
            .where("orders.tenantId", "=", tenantId)
            .orderBy("orders.createdAt", "desc")
            .limit(5)
            .execute();

        const result: OutputType = {
            metrics: {
                totalRevenue: revenueResult?.totalRevenue ?? "0",
                totalOrders: Number(revenueResult?.totalOrders ?? 0),
                totalCustomers: Number(revenueResult?.totalCustomers ?? 0),
                averageOrderValue: revenueResult?.averageOrderValue ?? "0",
                pendingOrders: Number(pendingOrders),
                completedOrders: Number(completedOrders),
            },
            revenueByDay: revenueByDayResult.map((row) => ({
                date: row.date,
                revenue: row.revenue ?? "0",
                orders: Number(row.orders),
            })),
            topProducts: topProductsResult.map((row) => ({
                productId: Number(row.productId ?? 0),
                productName: row.productName ?? "Unknown",
                productSlug: row.productSlug,
                quantitySold: Number(row.quantitySold),
                revenue: String(row.revenue ?? "0"),
            })),
            recentOrders: recentOrdersResult.map((row) => ({
                id: row.id,
                orderNumber: row.orderNumber,
                customerName: row.customerName ?? "Guest",
                total: row.total.toString(),
                status: row.status,
                createdAt: row.createdAt,
            })),
        };

        return new Response(superjson.stringify(result));
    } catch (error) {
        console.error("analytics error:", error);
        const message = error instanceof Error ? error.message : "Failed to load analytics";
        return new Response(superjson.stringify({ error: message }), { status: 400 });
    }
}
