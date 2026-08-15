import superjson from "superjson";
import { z } from "zod";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { requireTenantPermission } from "../../helpers/tenantContext";

const BodySchema = z.object({
    email: z.string().email("Invalid email address"),
    role: z.enum(["owner", "admin", "manager", "sales", "inventory", "support"]),
});

export type OutputType = {
    invitation: {
        id: number;
        email: string;
        role: string;
        tenantId: number;
        invitedBy: string;
        invitedAt: Date;
        status: "pending" | "accepted";
    };
};

export async function handle(request: Request) {
    try {
        if (request.method !== "POST") {
            return new Response(superjson.stringify({ error: "Method not allowed" }), { status: 405 });
        }

        const user = await getServerUserSession(request);
        if (!user) {
            return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const parsed = BodySchema.safeParse(await request.json());
        if (!parsed.success) {
            return new Response(superjson.stringify({ error: "Invalid request body", details: parsed.error.flatten() }), { status: 400 });
        }

        const { email, role } = parsed.data;

        // Get the user's tenant associations to determine which tenant they're inviting to
        const userTenant = await db
            .selectFrom("tenant_users")
            .select(["tenant_id"])
            .where("user_id", "=", user.id)
            .executeTakeFirst();

        if (!userTenant) {
            return new Response(superjson.stringify({ error: "User not associated with any tenant" }), { status: 400 });
        }

        const tenantId = userTenant.tenant_id;

        // Check permission - only owners and admins can invite staff
        await requireTenantPermission(user.id, tenantId, "staff.manage");

        // Check if user already exists in the platform
        const existingUser = await db
            .selectFrom("users")
            .select(["id", "email", "name"])
            .where("email", "=", email.toLowerCase())
            .executeTakeFirst();

        let userId: number | null = null;
        let isExistingUser = false;

        if (existingUser) {
            // Check if user is already in this tenant
            const existingMembership = await db
                .selectFrom("tenant_users")
                .select(["id"])
                .where("tenant_id", "=", tenantId)
                .where("user_id", "=", existingUser.id)
                .executeTakeFirst();

            if (existingMembership) {
                return new Response(superjson.stringify({ error: "User is already a member of this store" }), { status: 400 });
            }

            userId = existingUser.id;
            isExistingUser = true;
        } else {
            // Create new user account with temporary password
            const bcrypt = await import("bcryptjs");
            const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
            const passwordHash = await bcrypt.hash(tempPassword, 10);

            const newUser = await db
                .insertInto("users")
                .values({
                    email: email.toLowerCase(),
                    password_hash: passwordHash,
                    name: email.split("@")[0], // Default name from email
                    is_super_admin: false,
                    createdAt: new Date(),
                })
                .returning(["id"])
                .executeTakeFirstOrThrow();

            userId = newUser.id;
            // In production, send email with temp password
            console.log(`New user created. Temporary password (send via email): ${tempPassword}`);
        }

        // Add user to tenant with specified role
        const invitation = await db
            .insertInto("tenant_users")
            .values({
                tenant_id: tenantId,
                user_id: userId!,
                role: role as any,
                invited_by_user_id: user.id,
                invited_at: new Date(),
                joined_at: isExistingUser ? new Date() : null,
            })
            .returning(["id", "tenant_id", "user_id", "role", "invited_by_user_id", "invited_at", "joined_at"])
            .executeTakeFirstOrThrow();

        // Get inviter name
        const inviterName = user.name || user.email;

        const result: OutputType = {
            invitation: {
                id: invitation.id,
                email: email.toLowerCase(),
                role: invitation.role,
                tenantId: invitation.tenant_id,
                invitedBy: inviterName,
                invitedAt: invitation.invited_at,
                status: isExistingUser ? "accepted" : "pending",
            },
        };

        return new Response(superjson.stringify(result));
    } catch (error) {
        console.error("staff invite error:", error);
        const message = error instanceof Error ? error.message : "Failed to invite staff member";
        return new Response(superjson.stringify({ error: message }), { status: 400 });
    }
}
