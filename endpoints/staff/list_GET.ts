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
  joinedAt: Date | null;
};

export type OutputType = {
  staff: StaffMember[];
};

export async function handle(request: Request) {
  try {
    const userSession = await getServerUserSession(request);
    if (!userSession || !userSession.user) {
      return new Response(superjson.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { user, tenantId: sessionTenantId } = userSession;

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

    await requireTenantPermission(user.id, tenantId, "staff.view");

    const rows = await db
      .selectFrom("tenantUsers")
      .innerJoin("users", "users.id", "tenantUsers.userId")
      .select([
        "tenantUsers.id",
        "tenantUsers.userId",
        "users.email",
        "users.displayName as name",
        "tenantUsers.role",
        "tenantUsers.joinedAt",
      ])
      .where("tenantUsers.tenantId", "=", tenantId)
      .execute();

    const staff: StaffMember[] = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      email: row.email,
      name: row.name,
      role: row.role,
      joinedAt: row.joinedAt,
    }));

    return new Response(superjson.stringify({ staff } satisfies OutputType));
  } catch (error) {
    console.error("staff list error:", error);
    const message = error instanceof Error ? error.message : "Failed to load staff members";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}
