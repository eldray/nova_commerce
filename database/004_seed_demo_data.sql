-- Seed Demo Data for Nova Commerce

-- 1. Demo User
INSERT INTO users (id, email, display_name, role)
VALUES (1, 'admin@novafashion.com', 'Ama Mensah', 'super_admin')
ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name;

INSERT INTO user_passwords (user_id, password_hash)
VALUES (1, 'b007a7eacbab29410c2ad77e3d233f7f:d884f6828603833e120487c297ae0b099ead21a00d1abb0b9f18e29d1e5e7a4e7df41a53559666ae7f5bc53bd00abf7edca6f56d3d5729318efdb86208dca039')
ON CONFLICT (id) DO NOTHING;

-- 2. Demo Tenant
INSERT INTO tenants (id, name, slug, status, created_by_user_id)
VALUES (1, 'Nova Fashion Ghana', 'nova-fashion', 'active', 1)
ON CONFLICT (slug) DO NOTHING;

-- 3. Tenant User Membership
INSERT INTO tenant_users (tenant_id, user_id, role)
VALUES (1, 1, 'owner')
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- 4. Demo Store
INSERT INTO stores (id, tenant_id, store_name, subdomain, currency, currency_symbol, contact_email, contact_phone, whatsapp_number, is_published, onboarding_step)
VALUES (
  1, 1, 'Nova Fashion Ghana', 'nova-fashion', 'GHS', 'GH₵',
  'support@novafashion.com', '+233 24 000 0000', '233240000000', true, 'completed'
)
ON CONFLICT (tenant_id) DO UPDATE SET
  is_published = true,
  store_name = EXCLUDED.store_name;

-- 5. Categories
INSERT INTO categories (id, tenant_id, name, slug, description, image_url, position)
VALUES 
  (1, 1, 'Women''s Fashion', 'womens-fashion', 'Vibrant Ankara dresses, skirts, and blouses designed for elegance.', '/static/demo/fashion_dress.png', 1),
  (2, 1, 'Men''s Wear', 'mens-wear', 'Tailored Kente suits, blazers, and contemporary African menswear.', '/static/demo/kente_suit.png', 2),
  (3, 1, 'Accessories', 'accessories', 'Handcrafted leather bags, statement jewelry, and traditional headwraps.', '/static/demo/leather_handbag.png', 3),
  (4, 1, 'Footwear', 'footwear', 'Premium artisan leather shoes and woven sandals.', '/static/demo/beaded_necklace.png', 4)
ON CONFLICT (tenant_id, slug) DO UPDATE SET name = EXCLUDED.name, image_url = EXCLUDED.image_url;

-- 6. Brands
INSERT INTO brands (id, tenant_id, name, slug)
VALUES 
  (1, 1, 'Nova Couture', 'nova-couture'),
  (2, 1, 'Kente Royal', 'kente-royal'),
  (3, 1, 'AfriCraft', 'africraft')
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- 7. Products
INSERT INTO products (id, tenant_id, category_id, brand_id, name, slug, description, sku, status, price, sale_price, stock_quantity, low_stock_threshold)
VALUES 
  (
    1, 1, 1, 1,
    'Royal Ankara Print Maxi Dress',
    'royal-ankara-print-maxi-dress',
    'An exquisite floor-length Ankara print maxi dress tailored from 100% authentic cotton wax print. Features a flared silhouette and vibrant gold & indigo patterns.',
    'NV-ANK-001', 'active', 350.00, 299.00, 25, 5
  ),
  (
    2, 1, 2, 2,
    'Bespoke Kente Accent Blazer',
    'bespoke-kente-accent-blazer',
    'Modern slim-fit menswear blazer featuring authentic woven Bonwire Kente cloth lapel accents. Perfect for weddings, galas, and formal celebrations.',
    'NV-KNT-002', 'active', 580.00, 499.00, 15, 3
  ),
  (
    3, 1, 3, 3,
    'Handcrafted Luxury Leather Tote',
    'handcrafted-luxury-leather-tote',
    'Handmade genuine leather tote bag crafted by local master artisans in Ghana. Features gold brass hardware, soft interior suede lining, and zip closure.',
    'NV-BAG-003', 'active', 420.00, NULL, 18, 4
  ),
  (
    4, 1, 3, 3,
    'African Glass Beaded Statement Necklace',
    'african-glass-beaded-statement-necklace',
    'Vibrant handcrafted glass bead necklace inspired by traditional Krobo beadmaking heritage. Adds a bold artistic accent to any outfit.',
    'NV-JWL-004', 'active', 180.00, 150.00, 30, 5
  )
ON CONFLICT (tenant_id, slug) DO UPDATE SET
  status = 'active',
  price = EXCLUDED.price,
  sale_price = EXCLUDED.sale_price;

-- 8. Product Images
INSERT INTO product_images (product_id, url, position)
VALUES 
  (1, '/static/demo/fashion_dress.png', 1),
  (2, '/static/demo/kente_suit.png', 1),
  (3, '/static/demo/leather_handbag.png', 1),
  (4, '/static/demo/beaded_necklace.png', 1)
ON CONFLICT DO NOTHING;

-- 9. Delivery Zones
INSERT INTO delivery_zones (tenant_id, name, fee, free_delivery_threshold, estimated_days_min, estimated_days_max, is_active)
VALUES 
  (1, 'Accra Central & Ridge', 25.00, 300.00, 1, 2, true),
  (1, 'Tema & Spintex', 30.00, 400.00, 1, 2, true),
  (1, 'Kumasi Metropolis', 40.00, 500.00, 2, 3, true),
  (1, 'Nationwide Express Delivery', 65.00, 800.00, 3, 5, true)
ON CONFLICT DO NOTHING;
