import { NextRequest } from 'next/server';
import { getSessionUser } from '../../../helpers/getServerUserSession';
import { db } from '../../../lib/db';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Get authenticated user
    const user = await getSessionUser();
    
    if (!user) {
      return Response.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Check if user is platform admin
    const isAdmin = await db.query(`
      SELECT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1 AND r.name = 'platform_admin'
      ) as is_admin
    `, [user.id]);

    if (!isAdmin[0]?.is_admin) {
      return Response.json(
        { error: 'Forbidden. Platform admin access required.' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status');

    // Build query
    let query = `
      SELECT 
        el.status,
        COUNT(*) as count,
        COUNT(CASE WHEN el.opened_at IS NOT NULL THEN 1 END) as opened_count,
        COUNT(CASE WHEN el.bounced_at IS NOT NULL THEN 1 END) as bounced_count,
        el.template_name,
        DATE(el.sent_at) as date
      FROM email_logs el
      WHERE el.sent_at >= NOW() - INTERVAL '${days} days'
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (tenantId) {
      query += ` AND el.tenant_id = $${paramIndex}`;
      params.push(parseInt(tenantId));
      paramIndex++;
    }

    if (status) {
      query += ` AND el.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += `
      GROUP BY el.status, el.template_name, DATE(el.sent_at)
      ORDER BY date DESC, count DESC
      LIMIT 1000
    `;

    const stats = await db.query(query, params);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_sent,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened,
        COUNT(CASE WHEN bounced_at IS NOT NULL THEN 1 END) as bounced,
        ROUND(
          COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END)::numeric / 
          NULLIF(COUNT(CASE WHEN status = 'sent' THEN 1 END), 0) * 100, 
          2
        ) as open_rate,
        ROUND(
          COUNT(CASE WHEN status = 'failed' OR bounced_at IS NOT NULL THEN 1 END)::numeric / 
          NULLIF(COUNT(*), 0) * 100, 
          2
        ) as failure_rate
      FROM email_logs
      WHERE sent_at >= NOW() - INTERVAL '${days} days'
      ${tenantId ? `AND tenant_id = ${tenantId}` : ''}
    `;

    const summary = await db.query(summaryQuery);

    // Get top templates by volume
    const templatesQuery = `
      SELECT 
        template_name,
        COUNT(*) as sent_count,
        ROUND(
          COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END)::numeric / 
          NULLIF(COUNT(*), 0) * 100, 
          2
        ) as open_rate
      FROM email_logs
      WHERE sent_at >= NOW() - INTERVAL '${days} days'
      ${tenantId ? `AND tenant_id = ${tenantId}` : ''}
      GROUP BY template_name
      ORDER BY sent_count DESC
      LIMIT 10
    `;

    const topTemplates = await db.query(templatesQuery);

    // Get recent failures
    const failuresQuery = `
      SELECT 
        el.id,
        el.recipient,
        el.subject,
        el.template_name,
        el.error_log,
        el.sent_at,
        t.name as tenant_name
      FROM email_logs el
      LEFT JOIN tenants t ON el.tenant_id = t.id
      WHERE el.status = 'failed' OR el.bounced_at IS NOT NULL
      ${tenantId ? `AND el.tenant_id = ${tenantId}` : ''}
      ORDER BY el.sent_at DESC
      LIMIT 50
    `;

    const recentFailures = await db.query(failuresQuery);

    return Response.json({
      success: true,
      data: {
        summary: summary[0],
        stats: stats,
        topTemplates: topTemplates,
        recentFailures: recentFailures,
      },
    });

  } catch (error) {
    console.error('Get notifications stats error:', error);
    return Response.json(
      { error: 'Failed to get notification statistics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
