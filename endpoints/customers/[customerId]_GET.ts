import superjson from "superjson";
import { z } from "zod";
import { db, sql } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { requireTenantPermission } from "../../helpers/tenantContext";
import type { OutputType } from "./[customerId]_GET.schema";

const ParamsSchema = z.object({
    customerId: z.string(),
});

export async function handle(request: Request, { customerId }: { customerId: string }) {
    try {
        const user = await getServerUserSession(request);
        if (!user) {
            return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const parsed = ParamsSchema.safeParse({ customerId });
        if (!parsed.success) {
            return new Response(superjson.stringify({ error: "Invalid customer ID" }), { status: 400 });
        }

        const customerIdNum = Number(customerId);
        if (Number.isNaN(customerIdNum)) {
            return new Response(superjson.stringify({ error: "Customer ID must be a number" }), { status: 400 });
        }

        // First get the customer to check tenant ownership
        const customerCheck = await db
            .selectFrom("customers")
            .select(["id", "tenantId"])
            .where("id", "=", customerIdNum)
            .executeTakeFirst();

        if (!customerCheck) {
            return new Response(superjson.stringify({ error: "Customer not found" }), { status: 404 });
        }

        await requireTenantPermission(user.id, customerCheck.tenantId, "customers.view");

        // Get full customer details
        const customer = await db
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
            .where("customers.id", "=", customerIdNum)
            .groupBy([
                "customers.id",
                "customers.name",
                "customers.email",
                "customers.phone",
                "customers.createdAt",
            ])
            .executeTakeFirstOrThrow();

        // Get customer addresses
        const addresses = await db
            .selectFrom("customerAddresses")
            .select(["id", "type", "address", "city", "region", "country", "isDefault"])
            .where("customerId", "=", customerIdNum)
            .orderBy("isDefault", "desc")
            .execute();

        // Get customer orders (last 20)
        const orders = await db
            .selectFrom("orders")
            .select(["id", "orderNumber", "status", "total", "currency", "createdAt"])
            .where("customerId", "=", customerIdNum)
            .orderBy("createdAt", "desc")
            .limit(20)
            .execute();

        const result: OutputType = {
            customer: {
                id: customer.id,
                name: customer.name ?? "",
                email: customer.email ?? "",
                phone: customer.phone,
                totalOrders: Number(customer.totalOrders),
                totalSpent: customer.totalSpent.toString(),
                createdAt: customer.createdAt,
                addresses: addresses.map((a) => ({
                    id: a.id,
                    type: a.type,
                    address: a.address,
                    city: a.city,
                    region: a.region,
                    country: a.country,
                    isDefault: a.isDefault,
                })),
                orders: orders.map((o) => ({
                    id: o.id,
                    orderNumber: o.orderNumber,
                    status: o.status,
                    total: o.total.toString(),
                    currency: o.currency,
                    createdAt: o.createdAt,
                })),
            },
        };

        return new Response(superjson.stringify(result));
    } catch (error) {
        console.error("customer detail error:", error);
        const message = error instanceof Error ? error.message : "Failed to load customer";
        return new Response(superjson.stringify({ error: message }), { status: 400 });
    }
}
