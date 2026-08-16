-- Nova Commerce: Coupons and Product Reviews
-- Migration file to add coupon system and product reviews

-- Coupon types
CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed_amount', 'free_shipping');
CREATE TYPE coupon_status AS ENUM ('active', 'inactive', 'expired');

-- Coupons table
CREATE TABLE coupons (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type coupon_type NOT NULL DEFAULT 'percentage',
  value NUMERIC(12,2) NOT NULL,
  min_purchase_amount NUMERIC(12,2),
  max_discount_amount NUMERIC(12,2),
  usage_limit INTEGER,
  usage_limit_per_user INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  status coupon_status NOT NULL DEFAULT 'active',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  applicable_product_ids INTEGER[] DEFAULT '{}',
  applicable_category_ids INTEGER[] DEFAULT '{}',
  first_order_only BOOLEAN NOT NULL DEFAULT false,
  created_by_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_coupons_tenant_code ON coupons(tenant_id, code);
CREATE INDEX idx_coupons_status ON coupons(status);
CREATE INDEX idx_coupons_expires_at ON coupons(expires_at);

-- Coupon usage tracking
CREATE TABLE coupon_usages (
  id SERIAL PRIMARY KEY,
  coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discount_amount NUMERIC(12,2) NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coupon_usages_coupon_id ON coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_user_id ON coupon_usages(user_id);
CREATE INDEX idx_coupon_usages_order_id ON coupon_usages(order_id);
CREATE UNIQUE INDEX idx_coupon_usages_user_coupon ON coupon_usages(user_id, coupon_id);

-- Product reviews
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE product_reviews (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  status review_status NOT NULL DEFAULT 'pending',
  is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  not_helpful_count INTEGER NOT NULL DEFAULT 0,
  merchant_response TEXT,
  merchant_response_at TIMESTAMPTZ,
  responded_by_user_id INTEGER REFERENCES users(id),
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX idx_product_reviews_status ON product_reviews(status);
CREATE INDEX idx_product_reviews_rating ON product_reviews(rating);
CREATE UNIQUE INDEX idx_product_reviews_user_product ON product_reviews(user_id, product_id);

-- Review helpfulness tracking
CREATE TABLE review_helpfulness (
  id SERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (review_id, user_id)
);

CREATE INDEX idx_review_helpfulness_review_id ON review_helpfulness(review_id);

-- Add average rating cache to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_products_average_rating ON products(average_rating);

-- Add coupon-related fields to orders if not exists
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id INTEGER REFERENCES coupons(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_reason TEXT;

CREATE INDEX idx_orders_coupon_code ON orders(coupon_code);

COMMENT ON TABLE coupons IS 'Stores coupon/discount codes for promotional campaigns';
COMMENT ON TABLE coupon_usages IS 'Tracks which users have used which coupons';
COMMENT ON TABLE product_reviews IS 'Customer reviews and ratings for products';
COMMENT ON TABLE review_helpfulness IS 'Tracks user votes on review helpfulness';
