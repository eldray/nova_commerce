import { Request, Response } from 'express';
import { authenticateUser } from '../../middleware/auth';
import { db } from '../../config/database';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export const get = async (req: AuthRequest, res: Response) => {
  try {
    const user = authenticateUser(req);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }

    const domains = await db.query(
      `SELECT 
        cd.id,
        cd.domain,
        cd.status,
        cd.verification_token,
        cd.created_at,
        cd.verified_at,
        cd.ssl_enabled,
        cd.ssl_status,
        s.subdomain,
        s.custom_domain as active_custom_domain
       FROM custom_domains cd
       LEFT JOIN stores s ON s.user_id = cd.user_id
       WHERE cd.user_id = ? 
       ORDER BY cd.created_at DESC`,
      [user.id]
    );

    // Format response with helpful status information
    const formattedDomains = domains.map((d: any) => ({
      id: d.id,
      domain: d.domain,
      status: d.status,
      createdAt: d.created_at,
      verifiedAt: d.verified_at,
      sslEnabled: d.ssl_enabled,
      sslStatus: d.ssl_status,
      isActive: d.status === 'verified',
      storeUrl: d.status === 'verified' 
        ? `https://${d.domain}` 
        : `https://${d.subdomain || 'store'}.nova-commerce.app`,
      dnsInstructions: {
        cname: {
          type: 'CNAME',
          host: 'www',
          value: 'nova-commerce.app',
          configured: d.status === 'verified'
        },
        txt: {
          type: 'TXT',
          host: '@',
          value: `nova-commerce-verification=${d.verification_token}`,
          configured: d.status === 'verified'
        }
      }
    }));

    res.json({ 
      success: true, 
      domains: formattedDomains,
      count: formattedDomains.length
    });
  } catch (error: any) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch domains' 
    });
  }
};
