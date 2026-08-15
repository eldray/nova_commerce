-- Add profile fields to platform_users if missing
ALTER TABLE platform_users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Create user behavior tracking for recommendations
CREATE TABLE IF NOT EXISTS user_behavior (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES platform_users(id) ON DELETE CASCADE,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'view', 'cart_add', 'purchase', 'wishlist'
    product_id INTEGER,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_behavior_user ON user_behavior(user_id, created_at);
CREATE INDEX idx_user_behavior_event ON user_behavior(event_type);

-- Add trending score to products (calculated field cache)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS trending_score DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

CREATE INDEX idx_products_trending ON products(trending_score DESC, deleted_at);
