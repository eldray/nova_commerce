import { schema, OutputType } from "./payments_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { getCurrentTenantId, requireTenantPermission } from "../../helpers/tenantContext";
import { encryptSecret } from "../../helpers/encryption";

export type InputType = typeof schema._input;
export type OutputType = typeof schema._output;

export async function handle(request: Request) {
    try {
        const user = await getServerUserSession(request);
        if (!user) {
            return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
        }

export async function updatePaymentCredentials(input: InputType): Promise<OutputType> {
    const user = await getServerUserSession(new Request("http://localhost"));
    if (!user) {
        throw new Error("Unauthorized");
    }

    const tenantId = await getCurrentTenantId(new Request("http://localhost"));
    if (!tenantId) {
        throw new Error("No store selected");
    }

    const parsedInput = schema.parse(input);

    // Verify user has permission to manage payment settings
    await requireTenantPermission(user.id, tenantId, "admin");

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

    return {
        success: true,
        provider: parsedInput.provider,
    };
}

export async function handle(request: Request) {
    try {
        const json = superjson.parse(await request.text());
        const result = await updatePaymentCredentials(json);
        return new Response(superjson.stringify(result));
    } catch (error) {
        console.error("save_payment_settings error:", error);
        const message = error instanceof Error ? error.message : "Failed to save payment settings";
        return new Response(superjson.stringify({ error: message }), { status: 400 });
    }
}

// Client-side function to call the API
export async function updatePaymentCredentials(input: InputType): Promise<OutputType> {
    const res = await fetch("/api/settings/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: superjson.stringify(input),
    });

    const json = superjson.parse(await res.text());

    if (!res.ok) {
        throw new Error(json.error || "Failed to update payment credentials");
    }

    return json as OutputType;
}
