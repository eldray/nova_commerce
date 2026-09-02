import { db } from "./db";

export interface SessionUser {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  session?: {
    id: string;
    expiresAt: Date;
  };
}

export async function getServerUserSession(request: Request): Promise<SessionUser | null> {
  try {
    console.log('getServerUserSession called');
    
    // Get session token from cookie using the helper
    const { getSessionTokenFromRequest } = await import('./getSetServerSession');
    const sessionId = getSessionTokenFromRequest(request);
    console.log('Session ID from cookie:', sessionId);
    
    if (!sessionId) {
      console.log('No session ID found');
      return null;
    }

    // Query session with user data - using snake_case column names
    const session = await db
      .selectFrom("sessions")
      .innerJoin("users", "users.id", "sessions.user_id")
      .select([
        "users.id",
        "users.email",
        "users.display_name",
        "users.avatar_url",
        "users.role",
        "sessions.id as session_id",
        "sessions.expires_at",
      ])
      .where("sessions.id", "=", sessionId)
      .where("sessions.expires_at", ">", new Date())
      .executeTakeFirst();

    console.log('Session query result:', session ? 'Found' : 'Not found');

    if (!session) {
      console.log('No valid session found');
      return null;
    }

    return {
      id: session.id,
      email: session.email,
      displayName: session.display_name,
      avatarUrl: session.avatar_url,
      role: session.role,
      session: {
        id: session.session_id,
        expiresAt: session.expires_at,
      },
    };
  } catch (error) {
    console.error("getServerUserSession error:", error);
    return null;
  }
}

export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  return getServerUserSession(request);
}
