import { db } from "./db";
import { User } from "./User";
import { getSessionTokenFromRequest } from "./getSetServerSession";

export interface SessionUser extends User {
  session?: {
    id: string;
    expiresAt: Date;
  };
  tenantId?: number;
  tenantRole?: string;
}

export async function getServerUserSession(request: Request): Promise<SessionUser | null> {
  const token = getSessionTokenFromRequest(request);
  if (!token) return null;

  const session = await db
    .selectFrom("sessions")
    .innerJoin("users", "users.id", "sessions.userId")
    .leftJoin("tenantUsers", "tenantUsers.userId", "users.id")
    .select([
      "users.id",
      "users.email",
      "users.displayName",
      "users.avatarUrl",
      "users.role",
      "sessions.id as sessionId",
      "sessions.expiresAt",
      "tenantUsers.tenantId",
      "tenantUsers.role as tenantRole",
    ])
    .where("sessions.id", "=", token)
    .where("sessions.expiresAt", ">", new Date())
    .executeTakeFirst();

  if (!session) return null;

  return {
    id: session.id,
    email: session.email,
    displayName: session.displayName,
    avatarUrl: session.avatarUrl,
    role: session.role as User["role"],
    session: {
      id: session.sessionId,
      expiresAt: session.expiresAt,
    },
    tenantId: session.tenantId ?? undefined,
    tenantRole: session.tenantRole ?? undefined,
  };
}

export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  return getServerUserSession(request);
}

export async function validateRequest(request: Request): Promise<{ user: SessionUser | null }> {
  const user = await getServerUserSession(request);
  return { user };
}

export async function requireServerUserSession(request: Request): Promise<SessionUser> {
  const user = await getServerUserSession(request);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
