-- Product Images Table
CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Cloudinary data
  public_id VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  
  -- Image variants
  thumbnail_url TEXT,
  small_url TEXT,
  medium_url TEXT,
  large_url TEXT,
  
  -- Metadata
  alt_text VARCHAR(255),
  file_size INTEGER, -- in bytes
  mime_type VARCHAR(50),
  width INTEGER,
  height INTEGER,
  
  -- Display control
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  
  -- Status
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_tenant_id ON product_images(tenant_id);
CREATE INDEX idx_product_images_is_primary ON product_images(is_primary) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_images_sort_order ON product_images(sort_order) WHERE deleted_at IS NULL;

-- Add primary_image_url to products table if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'primary_image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN primary_image_url TEXT;
  END IF;
END $$;

-- Add image_count to products table
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'image_count'
  ) THEN
    ALTER TABLE products ADD COLUMN image_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Function to update product image count and primary image
CREATE OR REPLACE FUNCTION update_product_image_info()
RETURNS TRIGGER AS $$
BEGIN
  -- Update image count
  UPDATE products SET
    image_count = (
      SELECT COUNT(*) FROM product_images 
      WHERE product_id = NEW.product_id AND deleted_at IS NULL
    ),
    primary_image_url = (
      SELECT image_url FROM product_images 
      WHERE product_id = NEW.product_id AND is_primary = TRUE AND deleted_at IS NULL
      ORDER BY sort_order ASC
      LIMIT 1
    )
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for image insert/update
DROP TRIGGER IF EXISTS trg_update_product_image_info ON product_images;
CREATE TRIGGER trg_update_product_image_info
AFTER INSERT OR UPDATE OR DELETE ON product_images
FOR EACH ROW
EXECUTE FUNCTION update_product_image_info();
