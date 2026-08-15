-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'GHS',
    
    -- Plan limits
    max_products INTEGER DEFAULT -1, -- -1 = unlimited
    max_staff INTEGER DEFAULT 1,
    max_storage_gb INTEGER DEFAULT 5,
    
    -- Features
    has_custom_domain BOOLEAN DEFAULT FALSE,
    has_advanced_analytics BOOLEAN DEFAULT FALSE,
    has_coupon_system BOOLEAN DEFAULT FALSE,
    has_email_support BOOLEAN DEFAULT TRUE,
    has_priority_support BOOLEAN DEFAULT FALSE,
    has_api_access BOOLEAN DEFAULT FALSE,
    commission_rate DECIMAL(5, 2) DEFAULT 0, -- Platform commission percentage
    
    -- Visibility
    is_active BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Merchant Subscriptions Table
CREATE TABLE IF NOT EXISTS merchant_subscriptions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
    
    -- Subscription status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'trialing')),
    
    -- Billing cycle
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    
    -- Dates
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_period_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_period_end TIMESTAMP,
    trial_ends_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    
    -- Payment info
    amount DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'GHS',
    
    -- Metadata
    stripe_subscription_id VARCHAR(255) NULL,
    cancel_reason TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_tenant_active_subscription 
        UNIQUE (tenant_id, status)
);

-- Subscription Usage Tracking
CREATE TABLE IF NOT EXISTS subscription_usage (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER NOT NULL REFERENCES merchant_subscriptions(id) ON DELETE CASCADE,
    
    -- Usage metrics
    products_count INTEGER DEFAULT 0,
    staff_count INTEGER DEFAULT 0,
    storage_used_mb INTEGER DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    
    -- Period
    period_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    period_end TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscription Invoices
CREATE TABLE IF NOT EXISTS subscription_invoices (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES merchant_subscriptions(id) ON DELETE SET NULL,
    plan_id INTEGER REFERENCES subscription_plans(id),
    
    -- Invoice details
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GHS',
    
    -- Period
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    
    -- Payment
    payment_method VARCHAR(50) NULL,
    paid_at TIMESTAMP NULL,
    
    -- External references
    stripe_invoice_id VARCHAR(255) NULL,
    stripe_payment_intent_id VARCHAR(255) NULL,
    
    -- PDF
    pdf_url VARCHAR(500) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plan Feature Toggles (for granular control)
CREATE TABLE IF NOT EXISTS plan_features (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL,
    feature_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (plan_id, feature_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_merchant_subscriptions_tenant ON merchant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_subscriptions_status ON merchant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_merchant_subscriptions_period_end ON merchant_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_tenant ON subscription_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON subscription_invoices(status);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription ON subscription_usage(subscription_id);

-- Insert default plans
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, max_products, max_staff, max_storage_gb, has_custom_domain, has_advanced_analytics, has_coupon_system, has_priority_support, is_popular, sort_order) VALUES
('Starter', 'starter', 'Perfect for small businesses just starting out', 49.00, 490.00, 50, 2, 5, FALSE, FALSE, FALSE, FALSE, FALSE, 1),
('Professional', 'professional', 'For growing businesses with advanced needs', 99.00, 990.00, -1, 5, 20, TRUE, TRUE, TRUE, FALSE, TRUE, 2),
('Business', 'business', 'Complete solution for established businesses', 199.00, 1990.00, -1, -1, 100, TRUE, TRUE, TRUE, TRUE, FALSE, 3);

-- Add feature flags for each plan
INSERT INTO plan_features (plan_id, feature_key, feature_value) VALUES
-- Starter Plan (ID 1)
(1, 'products.limit', '50'),
(1, 'staff.limit', '2'),
(1, 'storage.limit', '5'),
(1, 'analytics.basic', 'true'),
(1, 'support.email', 'true'),
(1, 'support.priority', 'false'),

-- Professional Plan (ID 2)
(2, 'products.limit', '-1'),
(2, 'staff.limit', '5'),
(2, 'storage.limit', '20'),
(2, 'analytics.advanced', 'true'),
(2, 'support.email', 'true'),
(2, 'support.priority', 'false'),
(2, 'custom.domain', 'true'),
(2, 'coupons.enabled', 'true'),

-- Business Plan (ID 3)
(3, 'products.limit', '-1'),
(3, 'staff.limit', '-1'),
(3, 'storage.limit', '100'),
(3, 'analytics.advanced', 'true'),
(3, 'support.email', 'true'),
(3, 'support.priority', 'true'),
(3, 'custom.domain', 'true'),
(3, 'coupons.enabled', 'true'),
(3, 'api.access', 'true');

COMMENT ON TABLE subscription_plans IS 'SaaS subscription plans for merchants';
COMMENT ON TABLE merchant_subscriptions IS 'Active subscriptions for tenants';
COMMENT ON TABLE subscription_usage IS 'Monthly usage tracking per subscription';
COMMENT ON TABLE subscription_invoices IS 'Billing invoices for subscriptions';
COMMENT ON TABLE plan_features IS 'Granular feature flags per plan';
