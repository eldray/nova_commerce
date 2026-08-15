import { schema, OutputType } from "./initialize_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { resolvePaymentClient } from "../../helpers/resolvePaymentClient";
import { nanoid } from "nanoid";

export async function handle(request: Request) {
    try {
        const json = superjson.parse(await request.text());
        const input = schema.parse(json);

        const order = await db
            .selectFrom("orders")
            .selectAll()
            .where("id", "=", input.orderId)
            .executeTakeFirst();
        if (!order) {
            return new Response(superjson.stringify({ error: "Order not found" }), { status: 404 });
        }

        const resolved = await resolvePaymentClient(order.tenantId);
        if (!resolved) {
            return new Response(
                superjson.stringify({ available: false, reason: "This store has not set up online payments yet." } satisfies OutputType)
            );
        }

        const reference = `nc_${order.orderNumber}_${nanoid(6)}`;
        const amountMinorUnits = Math.round(Number(order.total) * 100);
        const host = request.headers.get("origin") ?? new URL(request.url).origin;

        const result = await resolved.client.initialize({
            reference,
            amountMinorUnits,
            currency: order.currency,
            email: order.guestEmail ?? "guest@novacommerce.app",
            callbackUrl: `${host}/order-confirmation?ref=${reference}`,
            metadata: { orderId: order.id, orderNumber: order.orderNumber },
        });

        await db
            .insertInto("paymentTransactions")
            .values({
                tenantId: order.tenantId,
                orderId: order.id,
                provider: resolved.provider,
                reference,
                amount: order.total,
                currency: order.currency,
                status: "pending",
            })
            .execute();

        return new Response(
            superjson.stringify({
                available: true,
                authorizationUrl: result.authorizationUrl,
                provider: resolved.provider,
            } satisfies OutputType)
        );
    } catch (error) {
        console.error("initialize payment error:", error);
        const message = error instanceof Error ? error.message : "Failed to initialize payment";
        return new Response(superjson.stringify({ error: message }), { status: 400 });
    }
}