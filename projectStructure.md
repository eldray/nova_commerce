nova-commerce/
├── README.md
├── base.css                                     # design tokens (light + dark theme)
├── database/
│   └── 001_multi_tenant_foundation.sql          # full Postgres schema (run this first)
├── static/__dev/
│   └── design-principles.md
├── helpers/
│   ├── schema.tsx                               # generated Kysely types (matches the SQL above)
│   ├── User.tsx                                 # platform User type
│   ├── permissions.tsx                          # RBAC: role -> permission map
│   ├── tenantContext.tsx                        # tenant isolation + permission checks (server-side)
│   ├── useMyStores.tsx                          # React Query hook
│   └── useCreateBusiness.tsx                    # React Query hook
├── components/
│   ├── _globalContextProviders.tsx              # wires AuthProvider app-wide
│   ├── ProtectedRoute.tsx                       # route guards incl. SuperAdminRoute
│   ├── AuthLayout.tsx / .module.css              # centered-card layout for login/register/onboarding
│   ├── StorefrontLayout.tsx / .module.css        # header+footer+whatsapp wrapper for storefront pages
│   ├── StorefrontHeader.tsx / .module.css
│   ├── StorefrontFooter.tsx / .module.css
│   ├── ProductCard.tsx / .module.css
│   └── WhatsAppButton.tsx / .module.css
├── endpoints/
│   ├── onboarding/
│   │   ├── create_business_POST.ts              # creates tenant+store+owner membership
│   │   └── create_business_POST.schema.ts
│   └── tenants/
│       ├── my_stores_GET.ts                     # lists the caller's stores
│       └── my_stores_GET.schema.ts
└── pages/
    ├── _index.tsx / .module.css / .pageLayout.tsx        # storefront homepage ("/")
    ├── login.tsx / .module.css / .pageLayout.tsx         # "/login"
    ├── register.tsx / .pageLayout.tsx                    # "/register"
    ├── onboarding.business-info.tsx / .module.css / .pageLayout.tsx   # "/onboarding/business-info"
    └── dashboard.tsx / .module.css / .pageLayout.tsx      # "/dashboard"