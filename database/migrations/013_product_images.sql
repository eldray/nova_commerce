-- Product Images Table
CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    url VARCHAR(2048) NOT NULL,
    thumbnail_url VARCHAR(2048),
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    file_key VARCHAR(512),
    file_size INTEGER,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_tenant_id ON product_images(tenant_id);
CREATE INDEX idx_product_images_is_primary ON product_images(is_primary) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_images_sort_order ON product_images(product_id, sort_order);

-- Update products table to add primary image reference
ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_image_url VARCHAR(2048);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_images_updated_at
    BEFORE UPDATE ON product_images
    FOR EACH ROW
    EXECUTE FUNCTION update_product_images_updated_at();

COMMENT ON TABLE product_images IS 'Stores multiple images per product with ordering and metadata';
COMMENT ON COLUMN product_images.is_primary IS 'Indicates the main product image shown in listings';
COMMENT ON COLUMN product_images.file_key IS 'S3 storage key for deletion/management';
