import crypto from "crypto";
import {
    PaymentProviderClient,
    InitializePaymentParams,
    InitializePaymentResult,
    VerifyPaymentResult,
} from "./paymentTypes";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export function createPaystackClient(secretKey: string): PaymentProviderClient {
    return {
        async initialize(params: InitializePaymentParams): Promise<InitializePaymentResult> {
            const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: params.email,
                    amount: params.amountMinorUnits,
                    currency: params.currency,
                    reference: params.reference,
                    callback_url: params.callbackUrl,
                    metadata: params.metadata ?? {},
                }),
            });

            const data = await response.json();
            if (!response.ok || !data.status) {
                throw new Error(data.message ?? "Failed to initialize Paystack transaction");
            }

            return {
                authorizationUrl: data.data.authorization_url,
                providerReference: data.data.reference,
            };
        },

        async verify(reference: string): Promise<VerifyPaymentResult> {
            const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
                headers: { Authorization: `Bearer ${secretKey}` },
            });
            const data = await response.json();
            if (!response.ok || !data.status) {
                throw new Error(data.message ?? "Failed to verify Paystack transaction");
            }

            const tx = data.data;
            return {
                success: tx.status === "success",
                status: tx.status === "success" ? "success" : tx.status === "failed" ? "failed" : "pending",
                amountMinorUnits: tx.amount,
                currency: tx.currency,
                channel: tx.channel,
                providerTransactionId: String(tx.id),
                raw: tx,
            };
        },

        verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
            if (!signatureHeader) return false;
            const hash = crypto.createHmac("sha512", secretKey).update(rawBody).digest("hex");
            // Constant-time comparison to avoid timing attacks on the webhook signature check.
            const a = Buffer.from(hash);
            const b = Buffer.from(signatureHeader);
            return a.length === b.length && crypto.timingSafeEqual(a, b);
        },
    };
}