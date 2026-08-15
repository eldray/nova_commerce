-- Custom Domains Table for Multi-Tenant Store Platform
-- Allows merchants to use their own branded domains

CREATE TABLE IF NOT EXISTS custom_domains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('pending', 'verified', 'failed', 'suspended') DEFAULT 'pending',
    verification_token VARCHAR(255) NOT NULL,
    dns_records_checked BOOLEAN DEFAULT FALSE,
    cname_configured BOOLEAN DEFAULT FALSE,
    txt_configured BOOLEAN DEFAULT FALSE,
    ssl_enabled BOOLEAN DEFAULT FALSE,
    ssl_status ENUM('none', 'pending', 'active', 'expired') DEFAULT 'none',
    verified_at TIMESTAMP NULL,
    failed_at TIMESTAMP NULL,
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_custom_domains_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_domain (domain),
    INDEX idx_status (status),
    INDEX idx_verification_token (verification_token),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add custom_domain column to stores table if not exists
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255) NULL UNIQUE AFTER subdomain,
ADD COLUMN IF NOT EXISTS ssl_enabled BOOLEAN DEFAULT FALSE AFTER custom_domain,
ADD INDEX idx_custom_domain (custom_domain);

-- Add DNS instructions table for tracking setup progress
CREATE TABLE IF NOT EXISTS domain_dns_instructions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    domain_id INT NOT NULL,
    record_type ENUM('CNAME', 'TXT', 'A') NOT NULL,
    host VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    ttl INT DEFAULT 3600,
    is_configured BOOLEAN DEFAULT FALSE,
    checked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_dns_instructions_domain
        FOREIGN KEY (domain_id) REFERENCES custom_domains(id) ON DELETE CASCADE,
    INDEX idx_domain_id (domain_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default DNS instructions template
INSERT INTO domain_dns_instructions (domain_id, record_type, host, value, ttl)
SELECT 
    cd.id,
    'CNAME',
    'www',
    'nova-commerce.app',
    3600
FROM custom_domains cd
WHERE NOT EXISTS (
    SELECT 1 FROM domain_dns_instructions ddi WHERE ddi.domain_id = cd.id
);

INSERT INTO domain_dns_instructions (domain_id, record_type, host, value, ttl)
SELECT 
    cd.id,
    'TXT',
    '@',
    CONCAT('nova-commerce-verification=', cd.verification_token),
    3600
FROM custom_domains cd
WHERE NOT EXISTS (
    SELECT 1 FROM domain_dns_instructions ddi WHERE ddi.domain_id = cd.id AND ddi.record_type = 'TXT'
);
