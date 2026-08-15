import { Request, Response } from 'express';
import { authenticateAdmin } from '../../middleware/auth';
import { DomainService } from '../../services/domainService';
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
    authenticateAdmin(req);

    const { domainId } = req.body;

    if (!domainId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Domain ID is required' 
      });
    }

    // Force verify the domain (admin override)
    await DomainService.forceVerifyDomain(domainId);

    // Get updated domain info
    const domain = await db.query(
      `SELECT 
        cd.*,
        u.email as user_email,
        s.subdomain
       FROM custom_domains cd
       JOIN users u ON cd.user_id = u.id
       LEFT JOIN stores s ON s.user_id = cd.user_id
       WHERE cd.id = ?`,
      [domainId]
    );

    // Update store with custom domain
    if (domain[0]) {
      await db.query(
        `UPDATE stores 
         SET custom_domain = ?, ssl_enabled = TRUE 
         WHERE user_id = ?`,
        [domain[0].domain, domain[0].user_id]
      );
    }

    res.json({ 
      success: true, 
      message: 'Domain manually verified by admin',
      data: domain[0]
    });
  } catch (error: any) {
    console.error('Error admin verifying domain:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to verify domain' 
    });
  }
};
