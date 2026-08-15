import { z } from "zod";
import { createEndpoint } from "@kitql/helper";
import superjson from "superjson";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { db } from "../../helpers/db";
import { eq, and, sql, desc, or } from "drizzle-orm";
import { tenants, stores, orders, products, customers, users, merchantSubscriptions } from "../../helpers/schema";

// Get all tenants with their store and subscription information for super admin
export const GET = createEndpoint({
  input: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
    status: z.enum(['draft', 'published', 'suspended', 'all']).optional().default('all'),
    search: z.string().optional().default(''),
  }),
  handler: async ({ page, limit, status, search }, event) => {
    const { user } = await getServerUserSession(event);

    if (!user || user.role !== 'super_admin') {
      throw new Error("Unauthorized - Super Admin access required", { cause: { status: 403 } });
    }

    try {
      const offset = (page - 1) * limit;

      // Build search condition
      const searchCondition = search
        ? or(
            sql`${tenants.name} LIKE ${`%${search}%`}`,
            sql`${stores.slug} LIKE ${`%${search}%`}`,
            sql`${users.email} LIKE ${`%${search}%`}`
          )
        : undefined;

      // Build status condition
      const statusCondition = status !== 'all'
        ? eq(stores.status, status)
        : undefined;

      // Get total count for pagination
      const countResult = await db
        .select({ count: sql<number>`count(distinct ${tenants.id})` })
        .from(tenants)
        .innerJoin(stores, eq(stores.tenantId, tenants.id))
        .innerJoin(users, eq(users.id, tenants.ownerId))
        .where(and(searchCondition, statusCondition));

      const totalItems = Number(countResult[0]?.count || 0);
      const totalPages = Math.ceil(totalItems / limit);

      // Get tenants with their stores and subscription info
      const tenantsList = await db
        .select({
          id: tenants.id,
          name: tenants.name,
          slug: stores.slug,
          status: stores.status,
          createdAt: tenants.createdAt,
          ownerEmail: users.email,
          ownerId: tenants.ownerId,
          planName: sql<string>`COALESCE(${subscriptionPlans.name}, 'Free')`.as('planName'),
          subscriptionStatus: sql<string>`COALESCE(${merchantSubscriptions.status}, 'free')`.as('subscriptionStatus'),
          productCount: sql<number>`(SELECT COUNT(*) FROM ${products} WHERE ${products.tenantId} = ${tenants.id})`.as('productCount'),
          orderCount: sql<number>`(SELECT COUNT(*) FROM ${orders} WHERE ${orders.storeId} IN (SELECT id FROM ${stores} WHERE ${stores.tenantId} = ${tenants.id}))`.as('orderCount'),
          revenueTotal: sql<number>`COALESCE((SELECT SUM(${orders.totalAmount}) FROM ${orders} WHERE ${orders.storeId} IN (SELECT id FROM ${stores} WHERE ${stores.tenantId} = ${tenants.id}) AND ${orders.status} = 'paid'), 0)`.as('revenueTotal'),
        })
        .from(tenants)
        .innerJoin(stores, eq(stores.tenantId, tenants.id))
        .innerJoin(users, eq(users.id, tenants.ownerId))
        .leftJoin(merchantSubscriptions, eq(merchantSubscriptions.tenantId, tenants.id))
        .leftJoin(subscriptionPlans, eq(subscriptionPlans.id, merchantSubscriptions.planId))
        .where(and(searchCondition, statusCondition))
        .orderBy(desc(tenants.createdAt))
        .limit(limit)
        .offset(offset);

      return superjson.stringify({
        success: true,
        tenants: tenantsList,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          limit,
        },
      });
    } catch (error) {
      console.error('Error fetching tenants:', error);
      throw new Error('Failed to fetch tenants', {
        cause: { status: 500 }
      });
    }
  },
});
