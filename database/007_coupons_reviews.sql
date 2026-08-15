-- Coupons and Reviews tables for Nova Commerce Platform

-- COUPONS TABLE
CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  description VARCHAR(500),
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount_amount DECIMAL(10,2),
  usage_limit INTEGER DEFAULT NULL,
  usage_count INTEGER DEFAULT 0,
  per_customer_limit INTEGER DEFAULT 1,
  valid_from TIMESTAMP NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMP DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  applicable_to_all_products BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP DEFAULT NULL,
  
  CONSTRAINT unique_coupon_code UNIQUE (tenant_id, code, deleted_at),
  CONSTRAINT chk_discount_percentage CHECK (discount_type != 'percentage' OR discount_value <= 100)
);

CREATE INDEX idx_coupons_tenant ON coupons(tenant_id, deleted_at);
CREATE INDEX idx_coupons_store ON coupons(store_id, deleted_at);
CREATE INDEX idx_coupons_code ON coupons(code, is_active, deleted_at);
CREATE INDEX idx_coupons_validity ON coupons(valid_from, valid_until, is_active);

-- COUPON USAGE TRACKING
CREATE TABLE IF NOT EXISTS coupon_usages (
  id SERIAL PRIMARY KEY,
  coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  discount_applied DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_order_coupon UNIQUE (order_id, coupon_id)
);

CREATE INDEX idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_customer ON coupon_usages(customer_id);
CREATE INDEX idx_coupon_usages_user ON coupon_usages(user_id);

-- PRODUCT REVIEWS TABLE
CREATE TABLE IF NOT EXISTS product_reviews (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  response_from_merchant TEXT,
  responded_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP DEFAULT NULL
);

CREATE INDEX idx_reviews_tenant ON product_reviews(tenant_id, deleted_at);
CREATE INDEX idx_reviews_store ON product_reviews(store_id, deleted_at);
CREATE INDEX idx_reviews_product ON product_reviews(product_id, is_approved, deleted_at);
CREATE INDEX idx_reviews_customer ON product_reviews(customer_id);
CREATE INDEX idx_reviews_rating ON product_reviews(rating, is_approved);
CREATE INDEX idx_reviews_verified ON product_reviews(is_verified_purchase, is_approved);

-- Update updated_at trigger for coupons
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_coupons_updated_at ON coupons;
CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_coupons_updated_at();

-- Update updated_at trigger for reviews
CREATE OR REPLACE FUNCTION update_product_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_reviews_updated_at ON product_reviews;
CREATE TRIGGER trg_product_reviews_updated_at
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_reviews_updated_at();

-- Add review stats to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Function to update product review stats
CREATE OR REPLACE FUNCTION update_product_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.is_approved THEN
      UPDATE products
      SET 
        average_rating = (
          SELECT COALESCE(AVG(rating), 0)
          FROM product_reviews
          WHERE product_id = NEW.product_id AND is_approved = TRUE AND deleted_at IS NULL
        ),
        review_count = (
          SELECT COUNT(*)
          FROM product_reviews
          WHERE product_id = NEW.product_id AND is_approved = TRUE AND deleted_at IS NULL
        )
      WHERE id = NEW.product_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products
    SET 
      average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM product_reviews
        WHERE product_id = OLD.product_id AND is_approved = TRUE AND deleted_at IS NULL
      ),
      review_count = (
        SELECT COUNT(*)
        FROM product_reviews
        WHERE product_id = OLD.product_id AND is_approved = TRUE AND deleted_at IS NULL
      )
    WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_product_review_stats ON product_reviews;
CREATE TRIGGER trg_update_product_review_stats
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_review_stats();
