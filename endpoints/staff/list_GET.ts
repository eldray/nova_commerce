import superjson from "superjson";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { requireTenantPermission } from "../../helpers/tenantContext";

export type StaffMember = {
    id: number;
    userId: number;
    email: string;
    name: string | null;
    role: string;
    invitedAt: Date;
    joinedAt: Date | null;
    invitedBy: string | null;
};

export type OutputType = {
    staff: StaffMember[];
};

export async function handle(request: Request) {
    try {
        const user = await getServerUserSession(request);
        if (!user) {
            return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        // Get the user's tenant associations
        const userTenant = await db
            .selectFrom("tenant_users")
            .select(["tenant_id"])
            .where("user_id", "=", user.id)
            .executeTakeFirst();

        if (!userTenant) {
            return new Response(superjson.stringify({ error: "User not associated with any tenant" }), { status: 400 });
        }

        const tenantId = userTenant.tenant_id;

        // Check permission
        await requireTenantPermission(user.id, tenantId, "staff.view");

        const rows = await db
            .selectFrom("tenant_users")
            .innerJoin("users", "users.id", "tenant_users.user_id")
            .leftJoin("inviter", "inviter.id", "tenant_users.invited_by_user_id")
            .select([
                "tenant_users.id",
                "tenant_users.user_id",
                "users.email",
                "users.name",
                "tenant_users.role",
                "tenant_users.invited_at",
                "tenant_users.joined_at",
                "inviter.name as inviter_name",
                "inviter.email as inviter_email",
            ])
            .where("tenant_users.tenant_id", "=", tenantId)
            .orderBy("tenant_users.invited_at", "desc")
            .execute();

        const staff: StaffMember[] = rows.map((row) => ({
            id: row.id,
            userId: row.user_id,
            email: row.email,
            name: row.name,
            role: row.role,
            invitedAt: row.invited_at,
            joinedAt: row.joined_at,
            invitedBy: row.inviter_name || row.inviter_email || null,
        }));

        return new Response(superjson.stringify({ staff } satisfies OutputType));
    } catch (error) {
        console.error("staff list error:", error);
        const message = error instanceof Error ? error.message : "Failed to load staff members";
        return new Response(superjson.stringify({ error: message }), { status: 400 });
    }
}
