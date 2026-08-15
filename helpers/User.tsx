// If you need to udpate this type, make sure to also update
// components/ProtectedRoute
// endpoints/auth/login_with_password_POST
// endpoints/auth/register_with_password_POST
// endpoints/auth/session_GET
// helpers/getServerUserSession
// together with this in one toolcall.

export interface User {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  // platform-level role: super_admin = Nova Commerce platform staff (see helpers/permissions
  // for per-tenant staff roles like owner/admin/manager/sales/inventory/support)
  role: "super_admin" | "admin" | "user";
}
