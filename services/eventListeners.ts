import { db } from '../lib/db';
import { emailService } from './emailService';

/**
 * Event Listeners Service
 * Triggers email notifications based on platform events
 */

export class EventListeners {
  /**
   * Initialize all event listeners
   */
  static async init() {
    console.log('📧 Event listeners initialized');
  }

  /**
   * Order Created Event
   */
  static async onOrderCreated(order: any) {
    try {
      // Send order confirmation to customer
      const customerEmail = order.customer_email;
      if (customerEmail) {
        await emailService.sendOrderConfirmation(order, customerEmail);
      }

      // Notify merchant about new order (if they have staff)
      await this.notifyMerchantNewOrder(order);
    } catch (error) {
      console.error('Error in onOrderCreated:', error);
    }
  }

  /**
   * Order Status Updated Event
   */
  static async onOrderStatusUpdated(order: any, newStatus: string) {
    try {
      const customerEmail = order.customer_email;
      if (!customerEmail) return;

      // Check if customer wants status update emails
      const prefs = await this.getUserPreferences(order.customer_id);
      if (!prefs.email_order_status_update) return;

      await emailService.sendOrderStatusUpdate(order, customerEmail, newStatus);
    } catch (error) {
      console.error('Error in onOrderStatusUpdated:', error);
    }
  }

  /**
   * Payment Successful Event
   */
  static async onPaymentSuccess(payment: any) {
    try {
      // Send payment receipt to customer
      const customerEmail = payment.customer_email;
      if (customerEmail) {
        await emailService.sendPaymentReceipt(payment, customerEmail);
      }
    } catch (error) {
      console.error('Error in onPaymentSuccess:', error);
    }
  }

  /**
   * Low Stock Alert Event
   */
  static async onLowStock(product: any, tenantId: number) {
    try {
      // Get store owner/manager emails
      const merchantEmails = await this.getMerchantEmails(tenantId);
      
      for (const email of merchantEmails) {
        // Check preferences
        const prefs = await this.getUserPreferencesByEmail(email, tenantId);
        if (prefs && !prefs.email_low_stock_alert) continue;

        const store = await db.store.findFirst({ where: { tenant_id: tenantId } });
        await emailService.sendLowStockAlert(product, store?.name || 'Your Store', email);
      }
    } catch (error) {
      console.error('Error in onLowStock:', error);
    }
  }

  /**
   * User Registered Event (Merchant)
   */
  static async onMerchantRegistered(user: any, storeName: string) {
    try {
      await emailService.sendWelcomeMerchant(user, storeName);
    } catch (error) {
      console.error('Error in onMerchantRegistered:', error);
    }
  }

  /**
   * User Registered Event (Customer)
   */
  static async onCustomerRegistered(user: any) {
    try {
      await emailService.sendWelcomeCustomer(user);
    } catch (error) {
      console.error('Error in onCustomerRegistered:', error);
    }
  }

  /**
   * Password Reset Requested Event
   */
  static async onPasswordResetRequested(user: any, resetToken: string) {
    try {
      await emailService.sendPasswordReset(user, resetToken);
    } catch (error) {
      console.error('Error in onPasswordResetRequested:', error);
    }
  }

  /**
   * Staff Invited Event
   */
  static async onStaffInvited(invite: any) {
    try {
      await emailService.sendStaffInvitation(invite);
    } catch (error) {
      console.error('Error in onStaffInvited:', error);
    }
  }

  /**
   * Subscription Renewal Reminder Event
   */
  static async onSubscriptionRenewal(subscription: any) {
    try {
      const merchantEmails = await this.getMerchantEmails(subscription.tenant_id);
      
      for (const email of merchantEmails) {
        await emailService.sendSubscriptionRenewal(subscription, email);
      }
    } catch (error) {
      console.error('Error in onSubscriptionRenewal:', error);
    }
  }

  /**
   * Helper: Get user preferences by user ID
   */
  private static async getUserPreferences(userId: number) {
    const prefs = await db.query(`
      SELECT * FROM notification_preferences
      WHERE user_id = $1
      LIMIT 1
    `, [userId]);

    if (prefs.length === 0) {
      return {
        email_order_confirmation: true,
        email_order_status_update: true,
        email_payment_receipt: true,
        email_password_reset: true,
        email_low_stock_alert: true,
        email_subscription_renewal: true,
        email_marketing: false,
      };
    }

    return prefs[0];
  }

  /**
   * Helper: Get user preferences by email
   */
  private static async getUserPreferencesByEmail(email: string, tenantId: number) {
    const result = await db.query(`
      SELECT np.* FROM notification_preferences np
      JOIN users u ON np.user_id = u.id
      WHERE u.email = $1 AND np.tenant_id = $2
      LIMIT 1
    `, [email, tenantId]);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Helper: Get merchant emails for a tenant
   */
  private static async getMerchantEmails(tenantId: number): Promise<string[]> {
    const result = await db.query(`
      SELECT DISTINCT u.email
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.tenant_id = $1 
        AND r.name IN ('owner', 'administrator', 'manager')
    `, [tenantId]);

    return result.map(row => row.email);
  }

  /**
   * Helper: Notify merchant about new order
   */
  private static async notifyMerchantNewOrder(order: any) {
    const merchantEmails = await this.getMerchantEmails(order.tenant_id);
    
    for (const email of merchantEmails) {
      // Send new order notification (could be a separate template)
      console.log(`Notifying merchant ${email} about new order #${order.order_number}`);
      // In production, send actual email
      // await emailService.queueEmail(email, `New Order #${order.order_number}`, 'new-order-merchant', { ... });
    }
  }
}

// Auto-initialize
EventListeners.init();

export default EventListeners;
