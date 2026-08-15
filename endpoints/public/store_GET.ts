import superjson from "superjson";
import { OutputType } from "./store_GET.schema";
import { db } from "../../helpers/db";

export async function handle(request: Request) {
    try {
        const row = await db
            .selectFrom("stores")
            .innerJoin("tenants", "tenants.id", "stores.tenantId")
            .select([
                "tenants.id as tenantId",
                "stores.storeName",
                "stores.currency",
                "stores.currencySymbol",
                "stores.whatsappNumber",
                "stores.logoUrl",
            ])
            .where("tenants.status", "in", ["trial", "active"])
            .orderBy("stores.createdAt", "asc")
            .executeTakeFirst();

        return new Response(superjson.stringify({ store: row ?? null } satisfies OutputType));
    } catch (error) {
        console.error("public store error:", error);
        const message = error instanceof Error ? error.message : "Failed to load store";
        return new Response(superjson.stringify({ error: message }), { status: 400 });
    }
}