import { db } from "./db";
import { decryptSecret } from "./encryption";
import { createPaystackClient } from "./paystackClient";
import { createHubtelClient } from "./hubtelClient";
import { PaymentProviderClient } from "./paymentTypes";
import { PaymentProvider } from "./schema";

export async function resolvePaymentClient(
    tenantId: number
): Promise<{ provider: PaymentProvider; client: PaymentProviderClient } | null> {
    const credentials = await db
        .selectFrom("paymentCredentials")
        .selectAll()
        .where("tenantId", "=", tenantId)
        .where("isActive", "=", true)
        .execute();

    // Preference order: Paystack first, then Hubtel. A merchant can have both configured
    // but only one flagged active at a time via the dashboard toggle.
    const paystack = credentials.find((c) => c.provider === "paystack");
    if (paystack) {
        const secretKey = decryptSecret(paystack.secretKeyEncrypted);
        return { provider: "paystack", client: createPaystackClient(secretKey) };
    }

    const hubtel = credentials.find((c) => c.provider === "hubtel");
    if (hubtel && hubtel.publicKey) {
        const clientSecret = decryptSecret(hubtel.secretKeyEncrypted);
        // For Hubtel, publicKey is stored as "clientId:merchantAccountNumber"
        const [clientId, merchantAccountNumber] = hubtel.publicKey.split(":");
        return {
            provider: "hubtel",
            client: createHubtelClient(clientId, clientSecret, merchantAccountNumber ?? clientId),
        };
    }

    return null;
}