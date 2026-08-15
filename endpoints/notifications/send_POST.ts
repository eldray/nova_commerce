import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '../../../helpers/getServerUserSession';
import { db } from '../../../lib/db';
import { emailService } from '../../../services/emailService';

const sendNotificationSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(500),
  template: z.string().min(1, 'Template name is required'),
  data: z.record(z.any()).optional(),
  tenantId: z.number().optional(),
});

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Get authenticated user
    const user = await getSessionUser();
    
    if (!user) {
      return Response.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = sendNotificationSchema.safeParse(body);
    
    if (!validation.success) {
      return Response.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { to, subject, template, data, tenantId } = validation.data;

    // Verify tenant access if tenantId provided
    if (tenantId && tenantId !== user.tenant_id) {
      // Check if user has admin permissions to send for other tenants
      const hasPermission = await db.query(`
        SELECT EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = $1 AND r.name IN ('owner', 'administrator')
        ) as has_admin_role
      `, [user.id]);

      if (!hasPermission[0]?.has_admin_role) {
        return Response.json(
          { error: 'Unauthorized to send notifications for this tenant' },
          { status: 403 }
        );
      }
    }

    // Queue the email for sending
    const emailId = await emailService.queueEmail(to, subject, template, data || {});

    return Response.json({
      success: true,
      emailId,
      message: 'Email queued for delivery',
    }, { status: 202 });

  } catch (error) {
    console.error('Send notification error:', error);
    return Response.json(
      { error: 'Failed to queue notification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
