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

export const del = async (req: AuthRequest, res: Response) => {
  try {
    const user = authenticateUser(req);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }

    const { domainId } = req.params;

    if (!domainId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Domain ID is required' 
      });
    }

    // Check if domain exists and belongs to user
    const domain = await db.query(
      `SELECT * FROM custom_domains WHERE id = ? AND user_id = ?`,
      [domainId, user.id]
    );

    if (!domain[0]) {
      return res.status(404).json({ 
        success: false, 
        error: 'Domain not found' 
      });
    }

    // If domain is verified, remove it from store first
    if (domain[0].status === 'verified') {
      await db.query(
        `UPDATE stores SET custom_domain = NULL, ssl_enabled = FALSE WHERE user_id = ?`,
        [user.id]
      );
    }

    // Delete the domain
    await db.query(
      `DELETE FROM custom_domains WHERE id = ? AND user_id = ?`,
      [domainId, user.id]
    );

    // Also delete associated DNS instructions
    await db.query(
      `DELETE FROM domain_dns_instructions WHERE domain_id = ?`,
      [domainId]
    );

    res.json({ 
      success: true, 
      message: 'Domain removed successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting domain:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to delete domain' 
    });
  }
};
