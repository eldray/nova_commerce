import { db } from "./db";
import { TenantRole } from "./schema";
import { Permission, roleHasPermission } from "./permissions";

export class TenantAccessError extends Error {
  constructor(message: string = "You do not have access to this store.") {
    super(message);
    this.name = "TenantAccessError";
  }
}

export class TenantPermissionError extends Error {
  constructor(message: string = "You do not have permission to perform this action.") {
    super(message);
    this.name = "TenantPermissionError";
  }
}

export interface TenantMembership {
  tenantId: number;
  userId: number;
  role: TenantRole;
  tenantName: string;
  tenantSlug: string;
  tenantStatus: string;
}

// Resolves the caller's membership for a specific tenant. Every endpoint that reads or
// writes tenant-scoped data (products, orders, customers, ...) MUST call this (or
// requireTenantPermission below) and use the returned tenantId in its queries — never
// trust a tenantId passed in the request body/query without this check, or Tenant A
// could read/write Tenant B's data.
export async function getTenantMembership(
  userId: number,
  tenantId: number
): Promise<TenantMembership> {
  const row = await db
    .selectFrom("tenantUsers")
    .innerJoin("tenants", "tenants.id", "tenantUsers.tenantId")
    .select([
      "tenantUsers.tenantId",
      "tenantUsers.userId",
      "tenantUsers.role",
      "tenants.name as tenantName",
      "tenants.slug as tenantSlug",
      "tenants.status as tenantStatus",
    ])
    .where("tenantUsers.userId", "=", userId)
    .where("tenantUsers.tenantId", "=", tenantId)
    .executeTakeFirst();

  if (!row) {
    throw new TenantAccessError();
  }

  if (row.tenantStatus === "deleted") {
    throw new TenantAccessError("This store no longer exists.");
  }

  return row;
}

// Convenience for endpoints that require a specific permission within a tenant.
export async function requireTenantPermission(
  userId: number,
  tenantId: number,
  permission: Permission
): Promise<TenantMembership> {
  const membership = await getTenantMembership(userId, tenantId);
  if (!roleHasPermission(membership.role, permission)) {
    throw new TenantPermissionError();
  }
  return membership;
}

// Returns every tenant the user belongs to (a user may staff multiple stores).
// Used for a "switch store" UI and to resolve a default tenant after login.
export async function getTenantsForUser(userId: number) {
  return db
    .selectFrom("tenantUsers")
    .innerJoin("tenants", "tenants.id", "tenantUsers.tenantId")
    .leftJoin("stores", "stores.tenantId", "tenants.id")
    .select([
      "tenants.id as tenantId",
      "tenants.name as tenantName",
      "tenants.slug as tenantSlug",
      "tenants.status as tenantStatus",
      "tenantUsers.role",
      "stores.id as storeId",
      "stores.storeName as storeName",
      "stores.onboardingStep",
      "stores.onboardingCompletedAt",
      "stores.isPublished",
    ])
    .where("tenantUsers.userId", "=", userId)
    .where("tenants.status", "!=", "deleted")
    .orderBy("tenantUsers.createdAt", "asc")
    .execute();
}

// Helper functions for getting tenant ID from session
export async function getTenantIdFromSession(request: Request): Promise<number | null> {
  const { getServerUserSession } = await import("./getServerUserSession");
  const user = await getServerUserSession(request);
  return user?.tenantId ?? null;
}

export async function getCurrentTenantId(): Promise<number | null> {
  // This is a legacy function - should be called with request context
  // For now, return null to indicate it needs proper context
  return null;
}
