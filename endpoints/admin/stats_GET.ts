import superjson from "superjson";
import { db, sql } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";

export type OutputType = {
    success: true;
    stats: {
        totalTenants: number;
        activeTenants: number;
        totalRevenue: number;
        totalOrders: number;
        totalProducts: number;
        totalCustomers: number;
        subscriptionRevenue: number;
        platformRevenue: number;
    };
};

export async function handle(request: Request) {
    try {
        const user = await getServerUserSession(request);
        if (!user || user.role !== "super_admin") {
            return new Response(
                superjson.stringify({ error: "Unauthorized - Super Admin access required" }),
                { status: 403 }
            );
        }

        const [
            totalTenantsResult,
            activeTenantsResult,
            totalRevenueResult,
            totalOrdersResult,
            totalProductsResult,
            totalCustomersResult,
            subscriptionRevenueResult,
        ] = await Promise.all([
            db.selectFrom("tenants").select((eb) => eb.fn.count<number>("id").as("count")).executeTakeFirst(),
            db
                .selectFrom("tenants")
                .select((eb) => eb.fn.count<number>("id").as("count"))
                .where("status", "=", "active")
                .executeTakeFirst(),
            db
                .selectFrom("orders")
                .select((eb) => eb.fn.sum<number>("total").as("total"))
                .where("paymentStatus", "=", "paid")
                .executeTakeFirst(),
            db.selectFrom("orders").select((eb) => eb.fn.count<number>("id").as("count")).executeTakeFirst(),
            db.selectFrom("products").select((eb) => eb.fn.count<number>("id").as("count")).executeTakeFirst(),
            db.selectFrom("customers").select((eb) => eb.fn.count<number>("id").as("count")).executeTakeFirst(),
            db
                .selectFrom("merchantSubscriptions")
                .select((eb) => eb.fn.sum<number>("amount").as("total"))
                .where("status", "=", "active")
                .executeTakeFirst(),
        ]);

        const subscriptionRevenue = Number(subscriptionRevenueResult?.total ?? 0);

        return new Response(
            superjson.stringify({
                success: true,
                stats: {
                    totalTenants: Number(totalTenantsResult?.count ?? 0),
                    activeTenants: Number(activeTenantsResult?.count ?? 0),
                    totalRevenue: Number(totalRevenueResult?.total ?? 0),
                    totalOrders: Number(totalOrdersResult?.count ?? 0),
                    totalProducts: Number(totalProductsResult?.count ?? 0),
                    totalCustomers: Number(totalCustomersResult?.count ?? 0),
                    subscriptionRevenue,
                    platformRevenue: subscriptionRevenue,
                },
            } satisfies OutputType)
        );
    } catch (error) {
        console.error("Error fetching platform stats:", error);
        const message = error instanceof Error ? error.message : "Failed to fetch platform statistics";
        return new Response(superjson.stringify({ error: message }), { status: 500 });
    }
}
