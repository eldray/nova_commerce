-- Homepage Builder Tables for Multi-Tenant Store Platform
-- Allows merchants to customize their store homepage without coding

-- Page Sections Table
CREATE TABLE IF NOT EXISTS page_sections (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    
    -- Section identification
    section_type VARCHAR(50) NOT NULL CHECK (section_type IN (
        'hero', 'banner', 'featured_products', 'categories', 
        'best_sellers', 'new_arrivals', 'product_carousel',
        'promotional', 'image_text', 'testimonials', 
        'newsletter', 'call_to_action', 'custom_html'
    )),
    
    -- Section configuration
    title VARCHAR(255),
    subtitle TEXT,
    settings JSONB DEFAULT '{}',
    
    -- Content
    background_image_url VARCHAR(500),
    background_color VARCHAR(50),
    text_color VARCHAR(50),
    
    -- Ordering and visibility
    sort_order INTEGER DEFAULT 0,
    is_enabled BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_store_id (store_id),
    INDEX idx_section_type (section_type),
    INDEX idx_sort_order (sort_order),
    INDEX idx_is_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Section Items Table (for products, categories, etc. within sections)
CREATE TABLE IF NOT EXISTS section_items (
    id SERIAL PRIMARY KEY,
    section_id INTEGER NOT NULL REFERENCES page_sections(id) ON DELETE CASCADE,
    
    -- Item reference
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('product', 'category', 'brand', 'custom_link')),
    item_id INTEGER,
    
    -- Custom link data (if item_type is 'custom_link')
    custom_title VARCHAR(255),
    custom_url VARCHAR(500),
    custom_image_url VARCHAR(500),
    
    -- Ordering
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_section_id (section_id),
    INDEX idx_item_type (item_type),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Homepage Templates Table (pre-built layouts)
CREATE TABLE IF NOT EXISTS homepage_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(500),
    category VARCHAR(50) DEFAULT 'general', -- fashion, electronics, grocery, etc.
    is_premium BOOLEAN DEFAULT FALSE,
    section_config JSONB, -- Pre-configured sections
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_is_premium (is_premium)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default templates
INSERT INTO homepage_templates (name, slug, description, category, section_config) VALUES
('Modern Commerce', 'modern-commerce', 'Clean and modern layout for general stores', 'general', 
 '[{"type":"hero","title":"Welcome to Our Store"},{"type":"featured_products","limit":8},{"type":"categories","limit":6},{"type":"best_sellers","limit":8}]'),
('Fashion Forward', 'fashion-forward', 'Elegant design for fashion and apparel stores', 'fashion',
 '[{"type":"hero","title":"New Collection"},{"type":"categories","limit":4},{"type":"new_arrivals","limit":12},{"type":"promotional"}]'),
('Tech Hub', 'tech-hub', 'Perfect for electronics and gadget stores', 'electronics',
 '[{"type":"hero","title":"Latest Technology"},{"type":"featured_products","limit":6},{"type":"product_carousel","category":"smartphones"},{"type":"best_sellers","limit":8}]'),
('Fresh Market', 'fresh-market', 'Ideal for grocery and food stores', 'grocery',
 '[{"type":"banner","title":"Fresh Daily"},{"type":"categories","limit":8},{"type":"promotional","title":"Special Offers"},{"type":"new_arrivals","limit":12}]');

-- Add homepage_template_id to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS homepage_template_id INTEGER NULL REFERENCES homepage_templates(id),
ADD COLUMN IF NOT EXISTS custom_homepage_enabled BOOLEAN DEFAULT FALSE;
