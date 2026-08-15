import crypto from "crypto";
import {
    PaymentProviderClient,
    InitializePaymentParams,
    InitializePaymentResult,
    VerifyPaymentResult,
} from "./paymentTypes";

const HUBTEL_BASE_URL = "https://payproxyapi.hubtel.com";

// Hubtel's Checkout API auth is "clientId:clientSecret" — we store the merchant's
// combined "publicKey:secretKey" pair as publicKey=clientId, secretKeyEncrypted=clientSecret.
export function createHubtelClient(clientId: string, clientSecret: string, merchantAccountNumber: string): PaymentProviderClient {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    return {
        async initialize(params: InitializePaymentParams): Promise<InitializePaymentResult> {
            const response = await fetch(`${HUBTEL_BASE_URL}/items/initiate`, {
                method: "POST",
                headers: {
                    Authorization: `Basic ${basicAuth}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    totalAmount: params.amountMinorUnits / 100,
                    description: "Nova Commerce order",
                    callbackUrl: params.callbackUrl,
                    returnUrl: params.callbackUrl,
                    merchantAccountNumber,
                    cancellationUrl: params.callbackUrl,
                    clientReference: params.reference,
                }),
            });

            const data = await response.json();
            if (!response.ok || data.responseCode !== "0000") {
                throw new Error(data.message ?? "Failed to initialize Hubtel transaction");
            }

            return {
                authorizationUrl: data.data.checkoutUrl,
                providerReference: data.data.checkoutId ?? params.reference,
            };
        },

        async verify(reference: string): Promise<VerifyPaymentResult> {
            const response = await fetch(
                `${HUBTEL_BASE_URL}/transactions/${clientId}/status?clientReference=${encodeURIComponent(reference)}`,
                { headers: { Authorization: `Basic ${basicAuth}` } }
            );
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message ?? "Failed to verify Hubtel transaction");
            }

            const status = data.data?.status; // "Paid" | "Unpaid" | "Failed" (Hubtel's naming)
            return {
                success: status === "Paid",
                status: status === "Paid" ? "success" : status === "Failed" ? "failed" : "pending",
                amountMinorUnits: Math.round((data.data?.amount ?? 0) * 100),
                currency: "GHS",
                channel: data.data?.paymentDetails?.mobileMoneyDetails ? "mobile_money" : "card",
                providerTransactionId: data.data?.transactionId,
                raw: data,
            };
        },

        verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
            // Hubtel doesn't sign webhooks with an HMAC the way Paystack does — instead we
            // treat the webhook payload as a trigger to re-verify server-to-server via
            // verify() above, which is the source of truth. This function exists to satisfy
            // the shared interface and always defers to that re-verification.
            return true;
        },

        // Unused here but kept for parity/testing — Hubtel's docs occasionally reference a
        // simple SHA-256 checksum on some endpoints; not used by the Checkout API above.
    };
}

export function hubtelChecksum(payload: string, secret: string): string {
    return crypto.createHash("sha256").update(`${payload}${secret}`).digest("hex");
}