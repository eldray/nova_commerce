-- Add publishing fields to stores table
ALTER TABLE stores 
ADD COLUMN published BOOLEAN DEFAULT FALSE,
ADD COLUMN publish_date TIMESTAMP NULL,
ADD COLUMN unpublish_reason VARCHAR(500) NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_stores_published ON stores(tenant_id, published);

-- Update existing stores to have published = false (draft by default)
UPDATE stores SET published = FALSE WHERE published IS NULL;
