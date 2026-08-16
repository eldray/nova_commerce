import { z } from "zod";
import { createEndpoint } from "@kitql/helper";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";
import { eq, and, sql } from "drizzle-orm";
import { tenants, stores, orders, products, customers, merchantSubscriptions } from "../../helpers/schema";

// Get platform-wide statistics for super admin
export const GET = createEndpoint({
  input: z.object({}).optional(),
  handler: async (_, event) => {
    const { user } = await getServerUserSession(event);

    if (!user || user.role !== 'super_admin') {
      throw new Error("Unauthorized - Super Admin access required", { cause: { status: 403 } });
    }

    try {
      // Get total tenants count
      const totalTenantsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(tenants);
      const totalTenants = Number(totalTenantsResult[0]?.count || 0);

      // Get active tenants (with published stores)
      const activeTenantsResult = await db
        .select({ count: sql<number>`count(distinct ${tenants.id})` })
        .from(tenants)
        .innerJoin(stores, eq(stores.tenantId, tenants.id))
        .where(eq(stores.status, 'published'));
      const activeTenants = Number(activeTenantsResult[0]?.count || 0);

      // Get total revenue (sum of all paid orders across all tenants)
      const totalRevenueResult = await db
        .select({ total: sql<number>`sum(${orders.totalAmount})` })
        .from(orders)
        .where(eq(orders.status, 'paid'));
      const totalRevenue = Number(totalRevenueResult[0]?.total || 0);

      // Get total orders count
      const totalOrdersResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders);
      const totalOrders = Number(totalOrdersResult[0]?.count || 0);

      // Get total products count
      const totalProductsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(products);
      const totalProducts = Number(totalProductsResult[0]?.count || 0);

      // Get total customers count
      const totalCustomersResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(customers);
      const totalCustomers = Number(totalCustomersResult[0]?.count || 0);

      // Get platform revenue from subscriptions
      const subscriptionRevenueResult = await db
        .select({ total: sql<number>`sum(${merchantSubscriptions.amount})` })
        .from(merchantSubscriptions)
        .where(eq(merchantSubscriptions.status, 'active'));
      const subscriptionRevenue = Number(subscriptionRevenueResult[0]?.total || 0);

      return superjson.stringify({
        success: true,
        stats: {
          totalTenants,
          activeTenants,
          totalRevenue,
          totalOrders,
          totalProducts,
          totalCustomers,
          subscriptionRevenue,
          platformRevenue: subscriptionRevenue, // Platform revenue from SaaS subscriptions
        },
      });
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      throw new Error('Failed to fetch platform statistics', {
        cause: { status: 500 }
      });
    }
  },
});
