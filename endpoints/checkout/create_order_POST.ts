import { schema, OutputType } from "./create_order_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { nanoid } from "nanoid";

export async function handle(request: Request) {
    try {
        const json = superjson.parse(await request.text());
        const input = schema.parse(json);

        const tenant = await db
            .selectFrom("tenants")
            .select(["id", "status"])
            .where("id", "=", input.tenantId)
            .executeTakeFirst();
        if (!tenant || tenant.status === "deleted" || tenant.status === "suspended") {
            return new Response(superjson.stringify({ error: "This store is not accepting orders." }), {
                status: 400,
            });
        }

        const result = await db.transaction().execute(async (trx) => {
            // Lock the ordered product rows so two concurrent checkouts can't both
            // oversell the last unit of stock.
            const productIds = input.items.map((i) => i.productId);
            const products = await trx
                .selectFrom("products")
                .selectAll()
                .where("tenantId", "=", input.tenantId)
                .where("id", "in", productIds)
                .where("status", "=", "active")
                .forUpdate()
                .execute();

            const productById = new Map(products.map((p) => [p.id, p]));

            let subtotal = 0;
            const lineItems: {
                productId: number;
                name: string;
                sku: string | null;
                unitPrice: number;
                quantity: number;
                lineTotal: number;
            }[] = [];

            for (const item of input.items) {
                const product = productById.get(item.productId);
                if (!product) {
                    throw new Error(`One of the items in your cart is no longer available.`);
                }
                if (product.stockQuantity < item.quantity) {
                    throw new Error(`Not enough stock for "${product.name}" — only ${product.stockQuantity} left.`);
                }
                const unitPrice = Number(product.salePrice ?? product.price);
                const lineTotal = unitPrice * item.quantity;
                subtotal += lineTotal;
                lineItems.push({
                    productId: product.id,
                    name: product.name,
                    sku: product.sku,
                    unitPrice,
                    quantity: item.quantity,
                    lineTotal,
                });
            }

            let deliveryFee = 0;
            if (input.deliveryZoneId) {
                const zone = await trx
                    .selectFrom("deliveryZones")
                    .selectAll()
                    .where("id", "=", input.deliveryZoneId)
                    .where("tenantId", "=", input.tenantId)
                    .where("isActive", "=", true)
                    .executeTakeFirst();
                if (!zone) {
                    throw new Error("Selected delivery zone is not available.");
                }
                const freeThreshold = zone.freeDeliveryThreshold ? Number(zone.freeDeliveryThreshold) : null;
                deliveryFee = freeThreshold !== null && subtotal >= freeThreshold ? 0 : Number(zone.fee);
            }

            const total = subtotal + deliveryFee;
            const orderNumber = `NC-${Date.now().toString(36).toUpperCase()}-${nanoid(4).toUpperCase()}`;

            const order = await trx
                .insertInto("orders")
                .values({
                    tenantId: input.tenantId,
                    orderNumber,
                    status: "pending",
                    paymentStatus: "unpaid",
                    subtotal: subtotal.toFixed(2),
                    deliveryFee: deliveryFee.toFixed(2),
                    total: total.toFixed(2),
                    deliveryZoneId: input.deliveryZoneId ?? null,
                    recipientName: input.recipientName,
                    recipientPhone: input.recipientPhone,
                    deliveryAddress: input.deliveryAddress,
                    deliveryCity: input.deliveryCity,
                    guestEmail: input.guestEmail ?? null,
                    notes: input.notes ?? null,
                })
                .returning(["id", "orderNumber", "total"])
                .executeTakeFirstOrThrow();

            for (const item of lineItems) {
                await trx
                    .insertInto("orderItems")
                    .values({
                        orderId: order.id,
                        productId: item.productId,
                        nameSnapshot: item.name,
                        skuSnapshot: item.sku,
                        unitPrice: item.unitPrice.toFixed(2),
                        quantity: item.quantity,
                        subtotal: item.lineTotal.toFixed(2),
                    })
                    .execute();

                await trx
                    .updateTable("products")
                    .set((eb) => ({ stockQuantity: eb("stockQuantity", "-", item.quantity) }))
                    .where("id", "=", item.productId)
                    .execute();

                await trx
                    .insertInto("inventoryMovements")
                    .values({
                        tenantId: input.tenantId,
                        productId: item.productId,
                        type: "sale",
                        quantityChange: -item.quantity,
                        reason: `Order ${order.orderNumber}`,
                        referenceType: "order",
                        referenceId: order.id,
                    })
                    .execute();
            }

            await trx
                .insertInto("orderStatusHistory")
                .values({ orderId: order.id, status: "pending", note: "Order placed" })
                .execute();

            return order;
        });

        return new Response(
            superjson.stringify({
                orderId: result.id,
                orderNumber: result.orderNumber,
                total: result.total,
            } satisfies OutputType)
        );
    } catch (error) {
        console.error("create_order error:", error);
        const message = error instanceof Error ? error.message : "Failed to place order";
        return new Response(superjson.stringify({ error: message }), { status: 400 });
    }
}