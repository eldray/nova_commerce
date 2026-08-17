import { schema } from "./payments_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { requireTenantPermission } from "../../helpers/tenantContext";
import { encryptSecret } from "../../helpers/encryption";

export type InputType = typeof schema._input;
export type OutputType = typeof schema._output;

export async function handle(request: Request) {
    try {
        const user = await getServerUserSession(request);
        if (!user) {
            return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const tenantId = user.tenantId;
        if (!tenantId) {
            return new Response(superjson.stringify({ error: "No store selected" }), { status: 400 });
        }

        const json = superjson.parse(await request.text());
        const parsedInput = schema.parse(json);

        // Verify user has permission to manage payment settings
        await requireTenantPermission(user.id, tenantId, "payments.manage");

        // Deactivate any existing credentials for this provider first
        await db
            .updateTable("paymentCredentials")
            .set({ isActive: false })
            .where("tenantId", "=", tenantId)
            .where("provider", "=", parsedInput.provider)
            .execute();

        // If isActive is true, deactivate all other providers (only one active at a time)
        if (parsedInput.isActive) {
            await db
                .updateTable("paymentCredentials")
                .set({ isActive: false })
                .where("tenantId", "=", tenantId)
                .where("provider", "!=", parsedInput.provider)
                .execute();
        }

        // Extract credentials based on provider
        let publicKey: string | null = null;
        let secretKey: string | null = null;
        let merchantId: string | null = null;
        let apiKey: string | null = null;

        if (parsedInput.provider === "paystack") {
            secretKey = parsedInput.credentials.secretKey;
            publicKey = parsedInput.credentials.publicKey || null;
        } else if (parsedInput.provider === "hubtel") {
            merchantId = parsedInput.credentials.merchantId || null;
            apiKey = parsedInput.credentials.apiKey || null;
            secretKey = parsedInput.credentials.secretKey; // Store API key as secret
        }

        // Encrypt the secret key before storing
        const encryptedSecret = secretKey ? encryptSecret(secretKey) : null;

        // Upsert the credentials
        await db
            .insertInto("paymentCredentials")
            .values({
                tenantId,
                provider: parsedInput.provider,
                publicKey,
                secretKeyEncrypted: encryptedSecret,
                merchantId,
                apiKeyEncrypted: apiKey ? encryptSecret(apiKey) : null,
                isActive: parsedInput.isActive,
            })
            .onConflict((oc) =>
                oc.column("tenantId").column("provider").doUpdateSet({
                    publicKey,
                    secretKeyEncrypted: encryptedSecret,
                    merchantId,
                    apiKeyEncrypted: apiKey ? encryptSecret(apiKey) : null,
                    isActive: parsedInput.isActive,
                    updatedAt: new Date(),
                })
            )
            .execute();

        return new Response(
            superjson.stringify({
                success: true,
                provider: parsedInput.provider,
            } satisfies OutputType)
        );
    } catch (error) {
        console.error("save_payment_settings error:", error);
        const message = error instanceof Error ? error.message : "Failed to save payment settings";
        return new Response(superjson.stringify({ error: message }), { status: 400 });
    }
}
