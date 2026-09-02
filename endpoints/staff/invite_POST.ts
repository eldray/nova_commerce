import superjson from "superjson";
import { z } from "zod";
import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { requireTenantPermission } from "../../helpers/tenantContext";
import { generatePasswordHash } from "../../helpers/generatePasswordHash";

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
    const userSession = await getServerUserSession(request);
    if (!userSession || !userSession.user) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { user, tenantId: sessionTenantId } = userSession;

    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return new Response(
        superjson.stringify({ error: "Invalid request body", details: parsed.error.flatten() }),
        { status: 400 }
      );
    }

    const { email, role } = parsed.data;

    const userTenant = sessionTenantId
      ? { tenantId: sessionTenantId }
      : await db
          .selectFrom("tenantUsers")
          .select(["tenantId"])
          .where("userId", "=", user.id)
          .executeTakeFirst();

    if (!userTenant) {
      return new Response(superjson.stringify({ error: "User not associated with any tenant" }), { status: 400 });
    }

    const tenantId = userTenant.tenantId;

    await requireTenantPermission(user.id, tenantId, "staff.manage");

    const existingUser = await db
      .selectFrom("users")
      .select(["id", "email", "displayName"])
      .where("email", "=", email.toLowerCase())
      .executeTakeFirst();

    let userId: number | null = null;
    let isExistingUser = false;

    if (existingUser) {
      const existingMembership = await db
        .selectFrom("tenantUsers")
        .select(["id"])
        .where("tenantId", "=", tenantId)
        .where("userId", "=", existingUser.id)
        .executeTakeFirst();

      if (existingMembership) {
        return new Response(superjson.stringify({ error: "User is already a member of this store" }), { status: 400 });
      }

      userId = existingUser.id;
      isExistingUser = true;
    } else {
      const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
      const passwordHash = await generatePasswordHash(tempPassword);

      const newUser = await db
        .insertInto("users")
        .values({
          email: email.toLowerCase(),
          displayName: email.split("@")[0],
          role: "user",
          createdAt: new Date(),
        })
        .returning(["id"])
        .executeTakeFirstOrThrow();

      await db
        .insertInto("userPasswords")
        .values({
          userId: newUser.id,
          passwordHash,
        })
        .execute();

      userId = newUser.id;
      console.log(`New user created. Temporary password (send via email): ${tempPassword}`);
    }

    const invitation = await db
      .insertInto("tenantUsers")
      .values({
        tenantId,
        userId: userId!,
        role: role as any,
        joinedAt: isExistingUser ? new Date() : null,
      })
      .returning(["id", "tenantId", "userId", "role", "joinedAt"])
      .executeTakeFirstOrThrow();

    const inviterName = user.displayName || user.email;

    const result: OutputType = {
      invitation: {
        id: invitation.id,
        email: email.toLowerCase(),
        role: invitation.role,
        tenantId: invitation.tenantId,
        invitedBy: inviterName,
        invitedAt: new Date(),
        status: isExistingUser ? "accepted" : "pending",
      },
    };

    return new Response(superjson.stringify(result));
  } catch (error: any) {
    console.error("Error inviting staff:", error);
    return new Response(superjson.stringify({ error: error.message || "Failed to invite staff" }), { status: 400 });
  }
}
