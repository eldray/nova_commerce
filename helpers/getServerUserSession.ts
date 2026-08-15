import { db } from "./db";
import { User } from "./User";
import { getSessionTokenFromRequest } from "./getSetServerSession";

export async function getServerUserSession(request: Request): Promise<User | null> {
  const token = getSessionTokenFromRequest(request);
  if (!token) return null;

  const session = await db
    .selectFrom("sessions")
    .innerJoin("users", "users.id", "sessions.userId")
    .select([
      "users.id",
      "users.email",
      "users.displayName",
      "users.avatarUrl",
      "users.role",
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
  };
}

export async function requireServerUserSession(request: Request): Promise<User> {
  const user = await getServerUserSession(request);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
