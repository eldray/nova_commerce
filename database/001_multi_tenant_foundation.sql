-- Nova Commerce: multi-tenant foundation (tenants, stores, RBAC, catalog, inventory, audit)
-- Applied to a Postgres database provisioned by Floot (Neon). Written in kysely-compatible
-- snake_case; helpers/schema.tsx is generated from this via kysely-codegen.

-- Extend platform user role to include super_admin (platform owner/staff)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Tenant (business account) lifecycle
CREATE TYPE tenant_status AS ENUM ('trial', 'active', 'suspended', 'deleted');

-- Per-tenant staff role (RBAC)
CREATE TYPE tenant_role AS ENUM ('owner', 'admin', 'manager', 'sales', 'inventory', 'support');

CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status tenant_status NOT NULL DEFAULT 'trial',
  created_by_user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);

-- Store settings/branding for a tenant's storefront (one store per tenant in v1)
CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  custom_domain TEXT UNIQUE,
  custom_domain_verified BOOLEAN NOT NULL DEFAULT false,
  currency TEXT NOT NULL DEFAULT 'GHS',
  currency_symbol TEXT NOT NULL DEFAULT 'GH₵',
  timezone TEXT NOT NULL DEFAULT 'Africa/Accra',
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  whatsapp_number TEXT,
  social_links JSONB NOT NULL DEFAULT '{}',
  theme TEXT NOT NULL DEFAULT 'modern-commerce',
  is_published BOOLEAN NOT NULL DEFAULT false,
  onboarding_step TEXT NOT NULL DEFAULT 'business_info',
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stores_subdomain ON stores(subdomain);
CREATE INDEX idx_stores_custom_domain ON stores(custom_domain);

-- Which platform users belong to which tenant, and with what role
CREATE TABLE tenant_users (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role tenant_role NOT NULL,
  invited_by_user_id INTEGER REFERENCES users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);

-- Catalog + inventory
CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE inventory_movement_type AS ENUM ('restock', 'sale', 'return', 'adjustment', 'reservation_release');

CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE INDEX idx_categories_tenant_id ON categories(tenant_id);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  status product_status NOT NULL DEFAULT 'draft',
  price NUMERIC(12,2) NOT NULL,
  sale_price NUMERIC(12,2),
  cost NUMERIC(12,2),
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  has_variants BOOLEAN NOT NULL DEFAULT false,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  weight_kg NUMERIC(8,3),
  dimensions_cm JSONB NOT NULL DEFAULT '{}',
  video_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_tenant_status ON products(tenant_id, status);
CREATE INDEX idx_products_category_id ON products(category_id);

CREATE TABLE product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);

CREATE TABLE product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku TEXT,
  attributes JSONB NOT NULL DEFAULT '{}',
  price NUMERIC(12,2) NOT NULL,
  sale_price NUMERIC(12,2),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_tenant_id ON product_variants(tenant_id);

CREATE TABLE inventory_movements (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
  type inventory_movement_type NOT NULL,
  quantity_change INTEGER NOT NULL,
  reason TEXT,
  reference_type TEXT,
  reference_id INTEGER,
  created_by_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_movements_tenant_id ON inventory_movements(tenant_id);
CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  actor_user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
