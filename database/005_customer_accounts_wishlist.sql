-- Customer Accounts & Wishlist Support
-- Ensures we have proper tables for public user accounts and wishlists

-- Wishlist Table
CREATE TABLE IF NOT EXISTS wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicates
    UNIQUE(tenant_id, customer_id, product_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wishlists_customer ON wishlists(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product ON wishlists(product_id);

-- Add 'is_published' flag to stores if not exists (for storefront visibility)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

COMMENT ON TABLE wishlists IS 'Stores customer favorite products per tenant';
