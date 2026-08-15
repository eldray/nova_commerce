import { Request, Response } from 'express';
import { authenticateAdmin } from '../../middleware/auth';
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
    authenticateAdmin(req);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status as string;

    // Build query with optional status filter
    let whereClause = '1=1';
    const params: any[] = [];

    if (statusFilter) {
      whereClause += ' AND cd.status = ?';
      params.push(statusFilter);
    }

    const totalResult = await db.query(
      `SELECT COUNT(*) as count FROM custom_domains cd WHERE ${whereClause}`,
      params
    );

    const domains = await db.query(
      `SELECT 
        cd.*,
        u.email as user_email,
        u.name as user_name,
        s.subdomain,
        s.store_name
       FROM custom_domains cd
       JOIN users u ON cd.user_id = u.id
       LEFT JOIN stores s ON s.user_id = cd.user_id
       WHERE ${whereClause}
       ORDER BY cd.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      domains,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalResult[0].count / limit),
        totalItems: totalResult[0].count
      }
    });
  } catch (error: any) {
    console.error('Error fetching admin domains:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch domains' 
    });
  }
};
