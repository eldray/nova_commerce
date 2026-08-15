import superjson from "superjson";
import { z } from "zod";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { requireTenantPermission } from "../../helpers/tenantContext";

const ParamsSchema = z.object({
    orderId: z.string(),
});

export type OutputType = {
    order: {
        id: number;
        orderNumber: string;
        status: string;
        paymentStatus: string;
        total: string;
        currency: string;
        recipientName: string;
        recipientPhone: string;
        recipientAddress: string;
        deliveryZoneId: number | null;
        deliveryFee: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        items: Array<{
            id: number;
            productId: number;
            productName: string;
            variantName: string | null;
            quantity: number;
            unitPrice: string;
            total: string;
            productSlug: string;
        }>;
        customer: {
            id: number;
            name: string;
            email: string;
            phone: string | null;
        } | null;
        payments: Array<{
            id: number;
            provider: string;
            amount: string;
            currency: string;
            status: string;
            transactionRef: string | null;
            paidAt: Date | null;
        }>;
    };
};

export async function handle(request: Request, { orderId }: { orderId: string }) {
    try {
        const user = await getServerUserSession(request);
        if (!user) {
            return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const parsed = ParamsSchema.safeParse({ orderId });
        if (!parsed.success) {
            return new Response(superjson.stringify({ error: "Invalid order ID" }), { status: 400 });
        }

        const orderIdNum = Number(orderId);
        if (Number.isNaN(orderIdNum)) {
            return new Response(superjson.stringify({ error: "Order ID must be a number" }), { status: 400 });
        }

        // First get the order to check tenant ownership
        const orderCheck = await db
            .selectFrom("orders")
            .select(["id", "tenantId"])
            .where("id", "=", orderIdNum)
            .executeTakeFirst();

        if (!orderCheck) {
            return new Response(superjson.stringify({ error: "Order not found" }), { status: 404 });
        }

        await requireTenantPermission(user.id, orderCheck.tenantId, "orders.view");

        // Get full order details
        const order = await db
            .selectFrom("orders")
            .leftJoin("customers", "customers.id", "orders.customerId")
            .selectAll("orders")
            .select([
                "customers.id as customerId",
                "customers.name as customerName",
                "customers.email as customerEmail",
                "customers.phone as customerPhone",
            ])
            .where("orders.id", "=", orderIdNum)
            .executeTakeFirstOrThrow();

        // Get order items
        const items = await db
            .selectFrom("orderItems")
            .leftJoin("products", "products.id", "orderItems.productId")
            .select([
                "orderItems.id",
                "orderItems.productId",
                "orderItems.productName",
                "orderItems.variantName",
                "orderItems.quantity",
                "orderItems.unitPrice",
                "orderItems.total",
                "products.slug as productSlug",
            ])
            .where("orderItems.orderId", "=", orderIdNum)
            .orderBy("orderItems.id", "asc")
            .execute();

        // Get payments
        const payments = await db
            .selectFrom("paymentTransactions")
            .select([
                "id",
                "provider",
                "amount",
                "currency",
                "status",
                "transactionRef",
                "paidAt",
            ])
            .where("orderId", "=", orderIdNum)
            .orderBy("createdAt", "desc")
            .execute();

        const result: OutputType = {
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                status: order.status,
                paymentStatus: order.paymentStatus,
                total: order.total.toString(),
                currency: order.currency,
                recipientName: order.recipientName,
                recipientPhone: order.recipientPhone ?? "",
                recipientAddress: order.recipientAddress,
                deliveryZoneId: order.deliveryZoneId,
                deliveryFee: order.deliveryFee.toString(),
                notes: order.notes,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                items: items.map((i) => ({
                    id: i.id,
                    productId: i.productId,
                    productName: i.productName,
                    variantName: i.variantName,
                    quantity: Number(i.quantity),
                    unitPrice: i.unitPrice.toString(),
                    total: i.total.toString(),
                    productSlug: i.productSlug ?? "",
                })),
                customer: order.customerId
                    ? {
                          id: order.customerId,
                          name: order.customerName ?? order.recipientName,
                          email: order.customerEmail ?? "",
                          phone: order.customerPhone ?? order.recipientPhone,
                      }
                    : null,
                payments: payments.map((p) => ({
                    id: p.id,
                    provider: p.provider,
                    amount: p.amount.toString(),
                    currency: p.currency,
                    status: p.status,
                    transactionRef: p.transactionRef,
                    paidAt: p.paidAt,
                })),
            },
        };

        return new Response(superjson.stringify(result));
    } catch (error) {
        console.error("order detail error:", error);
        const message = error instanceof Error ? error.message : "Failed to load order";
        return new Response(superjson.stringify({ error: message }), { status: 400 });
    }
}
