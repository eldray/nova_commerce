import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { requireTenantPermission } from "../../helpers/tenantContext";

export type OutputType = {
    id: number;
    storeName: string;
    subdomain: string;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
} | null;

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

        await requireTenantPermission(user.id, tenantId, "settings.view");

        const store = await db
            .selectFrom("stores")
            .select(["id", "storeName", "subdomain", "isPublished", "createdAt", "updatedAt"])
            .where("tenantId", "=", tenantId)
            .executeTakeFirst();

        if (!store) {
            return new Response(superjson.stringify({ error: "Store not found" }), { status: 404 });
        }

        return new Response(superjson.stringify(store satisfies OutputType));
    } catch (error) {
        console.error("store_status error:", error);
        const message = error instanceof Error ? error.message : "Failed to fetch store status";
        return new Response(superjson.stringify({ error: message }), { status: 400 });
    }
}
