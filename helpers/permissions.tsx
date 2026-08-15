import { TenantRole } from "./schema";

// Permission keys used across the merchant dashboard. Keep this list in sync with
// any UI/endpoint that gates on a permission.
export type Permission =
  | "products.view"
  | "products.create"
  | "products.edit"
  | "products.delete"
  | "inventory.view"
  | "inventory.adjust"
  | "orders.view"
  | "orders.update"
  | "customers.view"
  | "coupons.view"
  | "coupons.manage"
  | "delivery.manage"
  | "staff.view"
  | "staff.manage"
  | "settings.view"
  | "settings.manage"
  | "payments.manage"
  | "analytics.view"
  | "store.publish";

const ALL_PERMISSIONS: Permission[] = [
  "products.view",
  "products.create",
  "products.edit",
  "products.delete",
  "inventory.view",
  "inventory.adjust",
  "orders.view",
  "orders.update",
  "customers.view",
  "coupons.view",
  "coupons.manage",
  "delivery.manage",
  "staff.view",
  "staff.manage",
  "settings.view",
  "settings.manage",
  "payments.manage",
  "analytics.view",
  "store.publish",
];

// Role -> permission set. Owner and Admin get everything; other roles are scoped
// to the parts of the dashboard they actually need.
export const ROLE_PERMISSIONS: Record<TenantRole, Permission[]> = {
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  manager: [
    "products.view",
    "products.create",
    "products.edit",
    "products.delete",
    "inventory.view",
    "inventory.adjust",
    "orders.view",
    "orders.update",
    "customers.view",
    "coupons.view",
    "coupons.manage",
    "delivery.manage",
    "staff.view",
    "analytics.view",
    "settings.view",
  ],
  sales: ["products.view", "orders.view", "orders.update", "customers.view", "coupons.view"],
  inventory: ["products.view", "products.edit", "inventory.view", "inventory.adjust"],
  support: ["orders.view", "customers.view", "products.view"],
};

export function roleHasPermission(role: TenantRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionsForRole(role: TenantRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}
