import { Request, Response } from 'express';
import { DomainService } from '../../services/domainService';
import { authenticateUser } from '../../middleware/auth';
import { db } from '../../config/database';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export const post = async (req: AuthRequest, res: Response) => {
  try {
    // Authenticate user
    const user = authenticateUser(req);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }

    const { domain } = req.body;

    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Domain name is required' 
      });
    }

    // Clean and normalize domain
    const cleanedDomain = domain.toLowerCase().trim();
    
    // Remove protocol if present
    const domainWithoutProtocol = cleanedDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Check if user already has a verified domain
    const existingDomains = await db.query(
      `SELECT * FROM custom_domains WHERE user_id = ? AND status = 'verified'`,
      [user.id]
    );

    if (existingDomains.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'You already have a verified custom domain. Please remove it before adding a new one.' 
      });
    }

    // Add domain to system
    const result = await DomainService.addDomain(user.id, domainWithoutProtocol);

    // Create DNS instructions for this domain
    await db.query(
      `INSERT INTO domain_dns_instructions (domain_id, record_type, host, value, ttl) 
       VALUES (?, 'CNAME', 'www', 'nova-commerce.app', 3600)`,
      [result.id]
    );

    await db.query(
      `INSERT INTO domain_dns_instructions (domain_id, record_type, host, value, ttl) 
       VALUES (?, 'TXT', '@', CONCAT('nova-commerce-verification=', ?), 3600)`,
      [result.id, result.verificationToken]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Domain added successfully. Please configure your DNS records to verify ownership.',
      data: {
        domainId: result.id,
        domain: result.domain,
        verificationToken: result.verificationToken,
        status: result.status,
        nextSteps: [
          'Add CNAME record: www -> nova-commerce.app',
          'Add TXT record: @ -> nova-commerce-verification=' + result.verificationToken,
          'Wait for DNS propagation (5-30 minutes)',
          'Click "Verify" button to complete setup'
        ]
      }
    });
  } catch (error: any) {
    console.error('Error adding custom domain:', error);
    
    if (error.message.includes('already registered')) {
      return res.status(409).json({ 
        success: false, 
        error: 'This domain is already registered to another store' 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to add domain' 
    });
  }
};
