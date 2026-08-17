import { z } from "zod";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { requireTenantPermission } from "../../helpers/tenantContext";

const schema = z.object({});

export type OutputType = {
    success: boolean;
    store: unknown;
    message: string;
};

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

        await requireTenantPermission(user.id, tenantId, "store.publish");

        const store = await db
            .selectFrom("stores")
            .selectAll()
            .where("tenantId", "=", tenantId)
            .executeTakeFirst();

        if (!store) {
            return new Response(superjson.stringify({ error: "Store not found" }), { status: 404 });
        }

        const updatedStore = await db
            .updateTable("stores")
            .set({
                isPublished: false,
            })
            .where("tenantId", "=", tenantId)
            .returningAll()
            .executeTakeFirst();

        return new Response(
            superjson.stringify({
                success: true,
                store: updatedStore,
                message: "Store unpublished successfully",
            } satisfies OutputType)
        );
    } catch (error) {
        console.error("unpublish_store error:", error);
        const message = error instanceof Error ? error.message : "Failed to unpublish store";
        return new Response(superjson.stringify({ error: message }), { status: 400 });
    }
}
