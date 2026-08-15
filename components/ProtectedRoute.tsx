import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../helpers/useAuth";
import { User } from "../helpers/User";
import { AuthErrorPage } from "./AuthErrorPage";
import { ShieldOff } from "lucide-react";
import { AuthLoadingState } from "./AuthLoadingState";
import styles from "./ProtectedRoute.module.css";

// Do not use this in pageLayout
const MakeProtectedRoute: (roles: User["role"][]) => React.FC<{
  children: React.ReactNode;
}> =
  (roles) =>
  ({ children }) => {
    const { authState } = useAuth();

    if (authState.type === "loading") {
      return <AuthLoadingState title="Authenticating" />;
    }

    if (authState.type === "unauthenticated") {
      return <Navigate to="/login" replace />;
    }

    if (!roles.includes(authState.user.role)) {
      return (
        <AuthErrorPage
          title="Access Denied"
          message={`Access denied. Your role (${authState.user.role}) lacks required permissions.`}
          icon={<ShieldOff className={styles.accessDeniedIcon} size={64} />}
        />
      );
    }

    return <>{children}</>;
  };

// Create protected routes here, then import them in pageLayout
export const AdminRoute = MakeProtectedRoute(["admin"]);
export const UserRoute = MakeProtectedRoute(["user", "admin"]);
// Platform owner/staff console (Super Admin) — see helpers/permissions for per-tenant RBAC
export const SuperAdminRoute = MakeProtectedRoute(["super_admin"]);
// Any authenticated platform user (business owners/staff) — tenant-level RBAC is enforced separately
export const AuthenticatedRoute = MakeProtectedRoute(["user", "admin", "super_admin"]);
