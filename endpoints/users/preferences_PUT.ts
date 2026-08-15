import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '../../../helpers/getServerUserSession';
import { db } from '../../../lib/db';

const updatePreferencesSchema = z.object({
  email_order_confirmation: z.boolean().optional(),
  email_order_status_update: z.boolean().optional(),
  email_payment_receipt: z.boolean().optional(),
  email_password_reset: z.boolean().optional(),
  email_low_stock_alert: z.boolean().optional(),
  email_subscription_renewal: z.boolean().optional(),
  email_marketing: z.boolean().optional(),
  sms_order_confirmation: z.boolean().optional(),
  sms_order_status_update: z.boolean().optional(),
  whatsapp_order_update: z.boolean().optional(),
});

export async function PUT(request: NextRequest): Promise<Response> {
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
    const validation = updatePreferencesSchema.safeParse(body);
    
    if (!validation.success) {
      return Response.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const preferences = validation.data;

    // Check if preferences exist for this user
    const existingPrefs = await db.query(`
      SELECT * FROM notification_preferences
      WHERE user_id = $1 AND tenant_id = $2
    `, [user.id, user.tenant_id]);

    if (existingPrefs.length === 0) {
      // Create new preferences
      const newPrefs = await db.query(`
        INSERT INTO notification_preferences (
          user_id, tenant_id,
          email_order_confirmation,
          email_order_status_update,
          email_payment_receipt,
          email_password_reset,
          email_low_stock_alert,
          email_subscription_renewal,
          email_marketing,
          sms_order_confirmation,
          sms_order_status_update,
          whatsapp_order_update
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        user.id,
        user.tenant_id,
        preferences.email_order_confirmation ?? true,
        preferences.email_order_status_update ?? true,
        preferences.email_payment_receipt ?? true,
        preferences.email_password_reset ?? true,
        preferences.email_low_stock_alert ?? true,
        preferences.email_subscription_renewal ?? true,
        preferences.email_marketing ?? false,
        preferences.sms_order_confirmation ?? false,
        preferences.sms_order_status_update ?? false,
        preferences.whatsapp_order_update ?? false,
      ]);

      return Response.json({
        success: true,
        preferences: newPrefs[0],
        message: 'Notification preferences created',
      });
    } else {
      // Update existing preferences
      const updatedPrefs = await db.query(`
        UPDATE notification_preferences SET
          email_order_confirmation = COALESCE($3, email_order_confirmation),
          email_order_status_update = COALESCE($4, email_order_status_update),
          email_payment_receipt = COALESCE($5, email_payment_receipt),
          email_password_reset = COALESCE($6, email_password_reset),
          email_low_stock_alert = COALESCE($7, email_low_stock_alert),
          email_subscription_renewal = COALESCE($8, email_subscription_renewal),
          email_marketing = COALESCE($9, email_marketing),
          sms_order_confirmation = COALESCE($10, sms_order_confirmation),
          sms_order_status_update = COALESCE($11, sms_order_status_update),
          whatsapp_order_update = COALESCE($12, whatsapp_order_update),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND tenant_id = $2
        RETURNING *
      `, [
        user.id,
        user.tenant_id,
        preferences.email_order_confirmation,
        preferences.email_order_status_update,
        preferences.email_payment_receipt,
        preferences.email_password_reset,
        preferences.email_low_stock_alert,
        preferences.email_subscription_renewal,
        preferences.email_marketing,
        preferences.sms_order_confirmation,
        preferences.sms_order_status_update,
        preferences.whatsapp_order_update,
      ]);

      return Response.json({
        success: true,
        preferences: updatedPrefs[0],
        message: 'Notification preferences updated',
      });
    }

  } catch (error) {
    console.error('Update preferences error:', error);
    return Response.json(
      { error: 'Failed to update notification preferences', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

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

    // Get user's preferences
    const preferences = await db.query(`
      SELECT * FROM notification_preferences
      WHERE user_id = $1 AND tenant_id = $2
    `, [user.id, user.tenant_id]);

    if (preferences.length === 0) {
      // Return defaults if no preferences exist
      return Response.json({
        success: true,
        preferences: {
          email_order_confirmation: true,
          email_order_status_update: true,
          email_payment_receipt: true,
          email_password_reset: true,
          email_low_stock_alert: true,
          email_subscription_renewal: true,
          email_marketing: false,
          sms_order_confirmation: false,
          sms_order_status_update: false,
          whatsapp_order_update: false,
        },
      });
    }

    return Response.json({
      success: true,
      preferences: preferences[0],
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    return Response.json(
      { error: 'Failed to get notification preferences', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
