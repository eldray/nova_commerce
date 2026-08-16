import { getServerUserSession } from "../helpers/getServerUserSession";

export async function requireAuth(event: Request) {
  const { user, session } = await getServerUserSession(event);
  
  if (!user || !session) {
    throw new Error("Unauthorized", { cause: { status: 401 } });
  }
  
  return { user, session };
}

export async function requireAdmin(event: Request) {
  const { user, session } = await requireAuth(event);
  
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    throw new Error("Forbidden - Admin access required", { cause: { status: 403 } });
  }
  
  return { user, session };
}

export async function requireSuperAdmin(event: Request) {
  const { user, session } = await requireAuth(event);
  
  if (user.role !== 'super_admin') {
    throw new Error("Forbidden - Super Admin access required", { cause: { status: 403 } });
  }
  
  return { user, session };
}
