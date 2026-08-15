-- Email Notification System Migration
-- Adds comprehensive email logging, templates, and notification preferences

-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sent, failed, opened, bounced
    message_id VARCHAR(255),
    error_log TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL UNIQUE,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    email_order_confirmation BOOLEAN DEFAULT true,
    email_order_status_update BOOLEAN DEFAULT true,
    email_payment_receipt BOOLEAN DEFAULT true,
    email_password_reset BOOLEAN DEFAULT true,
    email_low_stock_alert BOOLEAN DEFAULT true,
    email_subscription_renewal BOOLEAN DEFAULT true,
    email_marketing BOOLEAN DEFAULT false,
    sms_order_confirmation BOOLEAN DEFAULT false,
    sms_order_status_update BOOLEAN DEFAULT false,
    whatsapp_order_update BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tenant_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_tenant ON email_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_logs(template_name);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_tenant ON notification_preferences(tenant_id);

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content, variables, is_active) VALUES
('order-confirmation', 'Order Confirmation - #{{orderNumber}}', 
 '<!-- HTML content loaded from file -->', 
 '["orderNumber", "orderDate", "customerName", "items", "subtotal", "tax", "shipping", "total", "shippingAddress", "storeName", "storeLogo"]',
 true),
 
('password-reset', 'Reset Your Password',
 '<!-- HTML content loaded from file -->',
 '["userName", "resetUrl", "expiryHours"]',
 true),
 
('welcome-merchant', 'Welcome to Nova Commerce!',
 '<!-- HTML content loaded from file -->',
 '["userName", "storeName", "dashboardUrl", "setupGuideUrl"]',
 true),
 
('welcome-customer', 'Welcome to Nova Commerce!',
 '<!-- HTML content loaded from file -->',
 '["userName", "shopUrl"]',
 true),
 
('staff-invitation', 'You''ve been invited to join {{store_name}}',
 '<!-- HTML content loaded from file -->',
 '["inviterName", "storeName", "roleName", "inviteUrl", "expiryDays"]',
 true),
 
('low-stock-alert', 'Low Stock Alert: {{productName}}',
 '<!-- HTML content loaded from file -->',
 '["productName", "currentStock", "threshold", "storeName", "productUrl"]',
 true),
 
('payment-receipt', 'Payment Receipt - {{transactionId}}',
 '<!-- HTML content loaded from file -->',
 '["transactionId", "amount", "currency", "paymentMethod", "paymentDate", "status", "orderNumber"]',
 true),
 
('order-status-update', 'Order Update - #{{orderNumber}}',
 '<!-- HTML content loaded from file -->',
 '["orderNumber", "oldStatus", "newStatus", "trackingNumber", "estimatedDelivery"]',
 true),
 
('subscription-renewal', 'Subscription Renewal Reminder',
 '<!-- HTML content loaded from file -->',
 '["planName", "renewalDate", "amount", "currency", "billingUrl"]',
 true)

ON CONFLICT (name) DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON email_logs TO postgres;
GRANT ALL ON email_templates TO postgres;
GRANT ALL ON notification_preferences TO postgres;

COMMENT ON TABLE email_logs IS 'Stores all sent emails with delivery status and tracking';
COMMENT ON TABLE email_templates IS 'Customizable email templates for different notification types';
COMMENT ON TABLE notification_preferences IS 'User preferences for email, SMS, and WhatsApp notifications';
