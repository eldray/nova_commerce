import { z } from "zod";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";

const schema = z.object({
    tenantId: z.number().int().positive(),
    action: z.enum(["suspend", "reactivate", "delete"]),
    reason: z.string().optional(),
    confirm: z.boolean().optional().default(false),
});

export type OutputType = { success: boolean; message: string };

export async function handle(request: Request) {
    try {
        const user = await getServerUserSession(request);
        if (!user || user.role !== "super_admin") {
            return new Response(
                superjson.stringify({ error: "Unauthorized - Super Admin access required" }),
                { status: 403 }
            );
        }

        const json = superjson.parse(await request.text());
        const { tenantId, action, reason, confirm } = schema.parse(json);

        if (action === "suspend") {
            await db.updateTable("tenants").set({ status: "suspended" }).where("id", "=", tenantId).execute();
            if (reason) {
                console.log(`Tenant ${tenantId} suspended by ${user.email}. Reason: ${reason}`);
            }
            return new Response(
                superjson.stringify({ success: true, message: "Store suspended successfully" } satisfies OutputType)
            );
        }

        if (action === "reactivate") {
            await db.updateTable("tenants").set({ status: "active" }).where("id", "=", tenantId).execute();
            return new Response(
                superjson.stringify({ success: true, message: "Store reactivated successfully" } satisfies OutputType)
            );
        }

        // action === "delete"
        if (!confirm) {
            return new Response(
                superjson.stringify({ error: "Confirmation required to delete tenant" }),
                { status: 400 }
            );
        }
        await db.deleteFrom("tenants").where("id", "=", tenantId).execute();
        return new Response(
            superjson.stringify({
                success: true,
                message: "Tenant and all associated data deleted permanently",
            } satisfies OutputType)
        );
    } catch (error) {
        console.error("Error performing tenant action:", error);
        const message = error instanceof Error ? error.message : "Failed to perform tenant action";
        return new Response(superjson.stringify({ error: message }), { status: 500 });
    }
}
