import { db } from "../../helpers/db";
import { resolvePaymentClient } from "../../helpers/resolvePaymentClient";
import superjson from "superjson";
import type { OutputType } from "./webhook_POST.schema";

export async function handle(request: Request) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get("x-paystack-signature") ?? request.headers.get("x-hubtel-signature");
        
        // Parse payload
        let payload: any;
        try {
            payload = JSON.parse(rawBody);
        } catch {
            return new Response(superjson.stringify({ error: "Invalid JSON payload" }), { status: 400 });
        }

        // Extract reference and event type based on provider format
        let reference: string | undefined;
        let event: string | undefined;
        let tenantId: number | undefined;

        // Paystack webhook format: { event: "charge.success", data: { reference: "...", ... } }
        if (payload.event && payload.data?.reference) {
            reference = payload.data.reference;
            event = payload.event;
            
            // Find the transaction to get tenant
            const tx = await db
                .selectFrom("paymentTransactions")
                .select(["tenantId", "orderId"])
                .where("reference", "=", reference)
                .executeTakeFirst();
            
            if (!tx) {
                return new Response(superjson.stringify({ received: false, error: "Transaction not found" }), { status: 404 });
            }
            tenantId = tx.tenantId;
        }
        // Hubtel webhook format varies - extract from data
        else if (payload.data?.clientReference) {
            reference = payload.data.clientReference;
            event = payload.eventType || "payment.status";
            
            const tx = await db
                .selectFrom("paymentTransactions")
                .select(["tenantId", "orderId"])
                .where("reference", "=", reference)
                .executeTakeFirst();
            
            if (!tx) {
                return new Response(superjson.stringify({ received: false, error: "Transaction not found" }), { status: 404 });
            }
            tenantId = tx.tenantId;
        } else {
            return new Response(superjson.stringify({ received: false, error: "Missing reference in payload" }), { status: 400 });
        }

        // Resolve payment client for this tenant
        const resolved = await resolvePaymentClient(tenantId!);
        if (!resolved) {
            return new Response(superjson.stringify({ received: false, error: "Payment provider not configured" }), { status: 400 });
        }

        // Verify webhook signature if provider supports it
        if (resolved.provider === "paystack" && signature) {
            const isValid = resolved.client.verifyWebhookSignature(rawBody, signature);
            if (!isValid) {
                return new Response(superjson.stringify({ received: false, error: "Invalid signature" }), { status: 401 });
            }
        }
        // For Hubtel, we skip signature check and rely on re-verification below

        // Re-verify payment with provider (source of truth)
        const verification = await resolved.client.verify(reference!);
        
        // Update transaction record
        await db
            .updateTable("paymentTransactions")
            .set({
                status: verification.status,
                providerTransactionId: verification.providerTransactionId,
                channel: verification.channel,
                rawWebhookPayload: payload,
                updatedAt: new Date(),
            })
            .where("reference", "=", reference!)
            .execute();

        // Get transaction and order
        const transaction = await db
            .selectFrom("paymentTransactions")
            .selectAll()
            .where("reference", "=", reference!)
            .executeTakeFirstOrThrow();

        const order = await db
            .selectFrom("orders")
            .selectAll()
            .where("id", "=", transaction.orderId)
            .executeTakeFirst();

        if (!order) {
            return new Response(superjson.stringify({ received: false, error: "Order not found" }), { status: 404 });
        }

        // If payment successful, update order status
        if (verification.success) {
            await db.transaction().execute(async (trx) => {
                // Update order payment status
                await trx
                    .updateTable("orders")
                    .set({
                        paymentStatus: "paid",
                        status: "processing",
                        updatedAt: new Date(),
                    })
                    .where("id", "=", order.id)
                    .execute();

                // Add status history
                await trx
                    .insertInto("orderStatusHistory")
                    .values({
                        orderId: order.id,
                        status: "processing",
                        note: `Payment confirmed via ${resolved.provider}. Transaction ID: ${verification.providerTransactionId}`,
                    })
                    .execute();
            });

            return new Response(
                superjson.stringify({
                    received: true,
                    status: "success",
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                } satisfies OutputType)
            );
        }

        // Payment failed or pending
        return new Response(
            superjson.stringify({
                received: true,
                status: verification.status,
                orderId: order.id,
            } satisfies OutputType)
        );

    } catch (error) {
        console.error("Webhook processing error:", error);
        const message = error instanceof Error ? error.message : "Failed to process webhook";
        return new Response(superjson.stringify({ received: false, error: message }), { status: 500 });
    }
}
