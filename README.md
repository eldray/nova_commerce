# Nova Commerce — source export (Phase 1 of 14)

This is the code I've written so far for the Nova Commerce multi-tenant e-commerce
SaaS, exported directly from the Floot project (`8d8c5218-5ca6-46aa-ad05-3fd1a1381bd1`).

## What's in here

- `database/001_multi_tenant_foundation.sql` — the full Postgres schema: tenants,
  stores, RBAC roles (tenant_users), product catalog (products/variants/categories/
  brands/images), inventory movements, audit log.
- `helpers/schema.tsx` — the generated Kysely types matching that schema.
- `helpers/permissions.tsx` + `helpers/tenantContext.tsx` — the RBAC/tenant-isolation
  layer every backend endpoint is meant to go through.
- `endpoints/onboarding/`, `endpoints/tenants/` — the two custom API routes built so
  far (create a business + list a user's stores).
- `endpoints/auth/`, `helpers/useAuth.tsx`, `helpers/getServerUserSession.tsx`,
  `helpers/getSetServerSession.tsx`, `helpers/generatePasswordHash.tsx`, `helpers/db.tsx`
  — Floot's seeded email/password + session auth (JWT-backed), included because the
  rest of the app depends on it. Not modified except `helpers/User.tsx` (added the
  `super_admin` role) and `components/PasswordRegisterForm.tsx` (added a
  `redirectTo` prop).
- `pages/` — storefront homepage (`_index.tsx`, demo store "Nova Fashion Ghana"),
  `login.tsx`, `register.tsx`, `onboarding.business-info.tsx` (step 1 of the setup
  wizard), `dashboard.tsx` (placeholder landing page proving the tenant/auth/RBAC
  loop end-to-end).
- `components/` — custom UI: `StorefrontHeader/Footer/Layout`, `ProductCard`,
  `WhatsAppButton`, `AuthLayout`, plus modified `ProtectedRoute` and
  `_globalContextProviders`.
- `base.css` — the full design-token system (light + dark) used throughout.

## What's NOT in here

This is application source only — **not a runnable standalone project**. It's
missing everything Floot's own build pipeline provides and that isn't exposed
through the MCP file-listing API:

- `package.json`, `vite.config`, `index.html`, router/entry setup
- The ~150-file shared UI kit these files import from (`components/Button.tsx`,
  `Input.tsx`, `Form.tsx`, `Select.tsx`, `Dialog.tsx`, etc. — Floot's pre-seeded
  shadcn-style component library)
- The live Postgres database itself (the SQL file is the schema, not a running DB)

To get something you can actually `npm install && npm run dev`, use Floot's own
**"Get Code!"** export from the project menu (packages everything above into a
runnable zip) and/or the pg_dump from the database cog icon — I called these out
because at last check code export may be gated behind a paid tier there.

## Where this leaves off

Phase 1–2 of the original 14-phase plan (architecture/DB + auth/multi-tenancy/RBAC)
is done. Still to build: merchant dashboard, product catalog UI, storefront
cart/checkout, Ghana payments (Paystack/Hubtel), orders/delivery, customers/coupons,
analytics, homepage builder/themes, subscriptions, super admin, custom domains,
hardening/testing.
