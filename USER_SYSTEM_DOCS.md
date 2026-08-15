# Nova Commerce Platform - User System Documentation

## 📋 Overview

The Nova Commerce Platform uses a **multi-level user system** with two distinct authentication layers:

1. **Platform Users** (Global) - For accessing the Nova Commerce SaaS platform itself
2. **Tenant Users** (Per-Store) - For managing individual stores within a tenant

---

## 👥 User Types & Roles

### **1. Platform-Level Users** (`users` table)

These users can log into the Nova Commerce platform itself.

| Role | Description | Access Level |
|------|-------------|--------------|
| `super_admin` | Platform owner/staff | Can access all tenants, manage platform settings, view analytics across all stores |
| `admin` | Platform administrator | Limited platform management capabilities |
| `user` | Regular merchant/tenant owner | Can create and manage their own stores only |

**File:** `/workspace/helpers/User.tsx`

```typescript
export interface User {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: "super_admin" | "admin" | "user";
}
```

### **2. Tenant-Level Roles** (`tenant_users` table)

Once a user creates/joins a store (tenant), they get a role within that specific tenant:

| Role | Permissions | Use Case |
|------|-------------|----------|
| `owner` | ALL permissions | Business owner who created the store |
| `admin` | ALL permissions | Store administrator |
| `manager` | Products, Inventory, Orders, Customers, Coupons, Delivery, Staff (view), Analytics, Settings (view) | Store manager |
| `sales` | Products (view), Orders (view/update), Customers (view), Coupons (view) | Sales staff |
| `inventory` | Products (view/edit), Inventory (view/adjust) | Warehouse/inventory staff |
| `support` | Orders (view), Customers (view), Products (view) | Customer support |

**File:** `/workspace/helpers/permissions.tsx`

---

## 🔐 Authentication Flow

### **Registration** (`/auth/register`)
1. User provides email, display name, password
2. System creates user with role `"user"` (default)
3. Password is hashed and stored in `userPasswords` table
4. Session cookie is created
5. User is redirected to onboarding wizard

### **Login** (`/auth/login`)
1. User provides email and password
2. System verifies credentials against `userPasswords` table
3. Creates session and returns user object
4. User is redirected to dashboard or storefront

### **Session Management**
- Sessions stored in `sessions` table
- 30-day expiration
- JWT-style session tokens
- Refresh token support

---

## 🏢 Multi-Tenancy Model

```
┌─────────────────────────────────────────────────────┐
│              Nova Commerce Platform                  │
│  (super_admin can access everything)                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐    ┌──────────────┐              │
│  │   Tenant A   │    │   Tenant B   │              │
│  │  (Store 1)   │    │  (Store 2)   │              │
│  ├──────────────┤    ├──────────────┤              │
│  │ Owner        │    │ Owner        │              │
│  │ Admin        │    │ Admin        │              │
│  │ Manager      │    │ Manager      │              │
│  │ Sales Staff  │    │ Support      │              │
│  │ Support      │    │              │              │
│  └──────────────┘    └──────────────┘              │
│                                                     │
│  Each tenant has ISOLATED:                          │
│  • Products         • Orders                        │
│  • Customers        • Payments                      │
│  • Inventory        • Settings                      │
│  • Staff            • Analytics                     │
└─────────────────────────────────────────────────────┘
```

### **Tenant Isolation Enforcement**

All database queries include `tenant_id` filtering:
- `/workspace/helpers/tenantContext.tsx` - Provides tenant context
- All API endpoints verify tenant membership
- RBAC checks performed before allowing actions
- Audit logs track all cross-tenant access attempts

---

## 🛠️ Creating a Super Admin

### **Option 1: Using the Script (Recommended)**

```bash
# Ensure PostgreSQL is running
# Set DATABASE_URL environment variable
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/nova_commerce"

# Run the creation script
tsx scripts/create-super-admin.ts
```

**Default Credentials:**
- Email: `admin@novacommerce.com`
- Password: `NovaAdmin2024!`

⚠️ **IMPORTANT:** Change these credentials immediately in production!

### **Option 2: Manual SQL**

```sql
-- Create super admin user
INSERT INTO users (email, "displayName", role)
VALUES ('admin@novacommerce.com', 'Platform Administrator', 'super_admin')
RETURNING id;

-- Then insert password hash (use helpers/generatePasswordHash.ts to generate)
INSERT INTO "userPasswords" ("userId", "passwordHash")
VALUES (<user_id_from_above>, '<hashed_password>');
```

### **Option 3: During Initial Setup**

Modify the registration endpoint temporarily to allow creating super_admin roles during initial platform setup, then disable this feature.

---

## 🎯 Permission System

### **Permission Keys**

```typescript
type Permission =
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
```

### **Role → Permission Mapping**

See `/workspace/helpers/permissions.tsx`:

- **Owner/Admin**: ALL permissions
- **Manager**: Most permissions except staff.manage, settings.manage, payments.manage, store.publish
- **Sales**: Read-only for products, full orders/customers, view coupons
- **Inventory**: Product and inventory management only
- **Support**: View-only for orders, customers, products

---

## 🔒 Security Features

### **Implemented:**
✅ Password hashing (bcrypt)  
✅ Session-based authentication  
✅ Role-Based Access Control (RBAC)  
✅ Tenant isolation at database level  
✅ Audit logging for sensitive actions  
✅ Encrypted payment credentials  
✅ Protected routes with permission checks  

### **Best Practices:**
- Never commit real credentials to `.env`
- Change default super admin password immediately
- Use HTTPS in production
- Implement rate limiting on auth endpoints
- Enable CORS properly for your domains
- Regular security audits

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `/helpers/User.tsx` | User type definition |
| `/helpers/permissions.tsx` | Role-permission mapping |
| `/helpers/schema.tsx` | Database schema types |
| `/helpers/tenantContext.tsx` | Tenant isolation logic |
| `/helpers/getServerUserSession.ts` | Session retrieval |
| `/helpers/getSetServerSession.ts` | Session cookie management |
| `/helpers/generatePasswordHash.ts` | Password hashing utility |
| `/endpoints/auth/*` | Authentication endpoints |
| `/components/ProtectedRoute.tsx` | Route protection HOC |
| `/scripts/create-super-admin.ts` | Super admin creation script |

---

## 🚀 Getting Started

### **For Platform Owners:**
1. Run `tsx scripts/create-super-admin.ts` to create your admin account
2. Login at `/login` with super admin credentials
3. Access super admin dashboard at `/admin` (when implemented)
4. Monitor all tenants from platform dashboard

### **For Merchants:**
1. Visit landing page and click "Sign Up"
2. Complete registration form
3. Go through 9-step onboarding wizard
4. Configure store, add products, connect payments
5. Publish store and start selling

### **For Store Staff:**
1. Store owner invites you via email (feature pending)
2. Accept invitation and set password
3. Login with assigned role permissions
4. Access only features relevant to your role

---

## 📞 Support

For issues or questions:
- Check `/workspace/docs/` for additional documentation
- Review migration files in `/workspace/migrations/`
- Examine endpoint implementations in `/workspace/endpoints/`

---

**Version:** 1.0  
**Last Updated:** August 2025  
**Platform:** Nova Commerce SaaS
