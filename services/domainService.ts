import { db } from '../config/database';

export interface DomainValidationResult {
  isValid: boolean;
  issues: string[];
}

export class DomainService {
  static async validateDomain(domain: string): Promise<DomainValidationResult> {
    const issues: string[] = [];
    
    // Basic domain format validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(domain)) {
      issues.push('Invalid domain format');
      return { isValid: false, issues };
    }

    // Check if domain already exists in system
    const existing = await db.query(
      `SELECT id FROM custom_domains WHERE domain = ?`,
      [domain.toLowerCase()]
    );

    if (existing.length > 0) {
      issues.push('Domain already registered to another store');
    }

    // Check for reserved domains
    const reservedDomains = ['localhost', 'nova-commerce', 'app', 'admin', 'api', 'www'];
    const subdomain = domain.split('.')[0].toLowerCase();
    if (reservedDomains.includes(subdomain)) {
      issues.push('This domain name is reserved');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  static async addDomain(userId: number, domain: string): Promise<any> {
    const validation = await this.validateDomain(domain);
    
    if (!validation.isValid) {
      throw new Error(`Invalid domain: ${validation.issues.join(', ')}`);
    }

    const verificationToken = `nv-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
    
    const result = await db.query(
      `INSERT INTO custom_domains (user_id, domain, status, verification_token, created_at) 
       VALUES (?, ?, 'pending', ?, NOW())`,
      [userId, domain.toLowerCase(), verificationToken]
    );

    return {
      id: result.insertId,
      domain: domain.toLowerCase(),
      verificationToken,
      status: 'pending'
    };
  }

  static async verifyDomain(domainId: number): Promise<boolean> {
    const domainRecord = await db.query(
      `SELECT domain, verification_token FROM custom_domains WHERE id = ? AND status = 'pending'`,
      [domainId]
    );
    
    if (!domainRecord[0]) {
      return false;
    }

    const { domain, verification_token } = domainRecord[0];
    
    // In production, this would check actual DNS records
    // For now, we'll simulate verification after a delay
    // The frontend will poll this endpoint
    
    const isVerified = await this.checkDNSRecords(domain, verification_token);
    
    if (isVerified) {
      await db.query(
        `UPDATE custom_domains 
         SET status = 'verified', verified_at = NOW() 
         WHERE id = ?`,
        [domainId]
      );
      
      // Update store with custom domain
      await db.query(
        `UPDATE stores 
         SET custom_domain = ?, ssl_enabled = TRUE 
         WHERE user_id = (SELECT user_id FROM custom_domains WHERE id = ?)`,
        [domain, domainId]
      );
      
      return true;
    }
    
    return false;
  }

  static async checkDNSRecords(domain: string, token: string): Promise<boolean> {
    // In production, use dns.promises or a DNS provider API
    // This is a placeholder that returns false until real DNS is set up
    // Frontend will show instructions and keep polling
    
    try {
      // Simulate DNS check - in real implementation:
      // 1. Check CNAME record points to nova-commerce.app
      // 2. Check TXT record contains verification token
      
      // For demo purposes, allow manual verification via admin panel
      return false;
    } catch (error) {
      return false;
    }
  }

  static async getDomainByUserId(userId: number): Promise<any[]> {
    const domains = await db.query(
      `SELECT id, domain, status, verification_token, created_at, verified_at 
       FROM custom_domains 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    return domains;
  }

  static async deleteDomain(domainId: number, userId: number): Promise<void> {
    const result = await db.query(
      `DELETE FROM custom_domains WHERE id = ? AND user_id = ?`,
      [domainId, userId]
    );
    
    if (result.affectedRows === 0) {
      throw new Error('Domain not found or access denied');
    }
  }

  static async forceVerifyDomain(domainId: number): Promise<void> {
    // Admin-only function to manually verify a domain
    await db.query(
      `UPDATE custom_domains 
       SET status = 'verified', verified_at = NOW() 
       WHERE id = ?`,
      [domainId]
    );
  }
}
