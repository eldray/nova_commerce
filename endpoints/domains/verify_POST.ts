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
    const user = authenticateUser(req);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }

    const { domainId } = req.body;

    if (!domainId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Domain ID is required' 
      });
    }

    // Verify domain ownership
    const domainRecord = await db.query(
      `SELECT * FROM custom_domains WHERE id = ? AND user_id = ?`,
      [domainId, user.id]
    );

    if (!domainRecord[0]) {
      return res.status(404).json({ 
        success: false, 
        error: 'Domain not found' 
      });
    }

    if (domainRecord[0].status === 'verified') {
      return res.json({ 
        success: true, 
        message: 'Domain already verified',
        data: {
          domainId: domainRecord[0].id,
          domain: domainRecord[0].domain,
          status: 'verified',
          verifiedAt: domainRecord[0].verified_at
        }
      });
    }

    // Attempt verification
    const isVerified = await DomainService.verifyDomain(domainId);

    if (isVerified) {
      const updatedDomain = await db.query(
        `SELECT * FROM custom_domains WHERE id = ?`,
        [domainId]
      );

      res.json({ 
        success: true, 
        message: 'Domain verified successfully! Your store is now accessible at your custom domain.',
        data: {
          domainId: updatedDomain[0].id,
          domain: updatedDomain[0].domain,
          status: 'verified',
          verifiedAt: updatedDomain[0].verified_at,
          customDomain: updatedDomain[0].custom_domain,
          sslEnabled: updatedDomain[0].ssl_enabled
        }
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'DNS records not yet configured correctly. Please check your DNS settings and try again.',
        data: {
          domainId,
          status: 'pending',
          instructions: {
            cname: {
              type: 'CNAME',
              host: 'www',
              value: 'nova-commerce.app'
            },
            txt: {
              type: 'TXT',
              host: '@',
              value: `nova-commerce-verification=${domainRecord[0].verification_token}`
            }
          }
        }
      });
    }
  } catch (error: any) {
    console.error('Error verifying domain:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to verify domain' 
    });
  }
};
