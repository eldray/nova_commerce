import { db } from "../helpers/db";
import { emailService } from "./emailService";

/**
 * Event Listeners Service
 * Triggers email notifications based on platform events
 */

export class EventListeners {
  /**
   * Initialize all event listeners
   */
  static async init() {
    console.log("📧 Event listeners initialized");
  }

  /**
   * Order Created Event
   */
  static async onOrderCreated(order: any) {
    try {
      const customerEmail = order.customer_email || order.customerEmail;
      if (customerEmail) {
        await emailService.sendOrderConfirmation(order, customerEmail);
      }

      await this.notifyMerchantNewOrder(order);
    } catch (error) {
      console.error("Error in onOrderCreated:", error);
    }
  }

  /**
   * Order Status Updated Event
   */
  static async onOrderStatusUpdated(order: any, newStatus: string) {
    try {
      const customerEmail = order.customer_email || order.customerEmail;
      if (!customerEmail) return;

      const prefs = await this.getUserPreferences(order.customer_id || order.customerId);
      if (prefs && !prefs.emailOrderStatusUpdate) return;

      await emailService.sendOrderStatusUpdate(order, customerEmail, newStatus);
    } catch (error) {
      console.error("Error in onOrderStatusUpdated:", error);
    }
  }

  /**
   * Payment Successful Event
   */
  static async onPaymentSuccess(payment: any) {
    try {
      const customerEmail = payment.customer_email || payment.customerEmail;
      if (customerEmail) {
        await emailService.sendPaymentReceipt(payment, customerEmail);
      }
    } catch (error) {
      console.error("Error in onPaymentSuccess:", error);
    }
  }

  /**
   * Low Stock Alert Event
   */
  static async onLowStock(product: any, tenantId: number) {
    try {
      const merchantEmails = await this.getMerchantEmails(tenantId);

      for (const email of merchantEmails) {
        const prefs = await this.getUserPreferencesByEmail(email, tenantId);
        if (prefs && !prefs.emailLowStockAlert) continue;

        const store = await db
          .selectFrom("stores")
          .select("storeName")
          .where("tenantId", "=", tenantId)
          .executeTakeFirst();

        await emailService.sendLowStockAlert(product, store?.storeName || "Your Store", email);
      }
    } catch (error) {
      console.error("Error in onLowStock:", error);
    }
  }

  /**
   * User Registered Event (Merchant)
   */
  static async onMerchantRegistered(user: any, storeName: string) {
    try {
      await emailService.sendWelcomeMerchant(user, storeName);
    } catch (error) {
      console.error("Error in onMerchantRegistered:", error);
    }
  }

  /**
   * User Registered Event (Customer)
   */
  static async onCustomerRegistered(user: any) {
    try {
      await emailService.sendWelcomeCustomer(user);
    } catch (error) {
      console.error("Error in onCustomerRegistered:", error);
    }
  }

  /**
   * Password Reset Requested Event
   */
  static async onPasswordResetRequested(user: any, resetToken: string) {
    try {
      await emailService.sendPasswordReset(user, resetToken);
    } catch (error) {
      console.error("Error in onPasswordResetRequested:", error);
    }
  }

  /**
   * Staff Invited Event
   */
  static async onStaffInvited(invite: any) {
    try {
      await emailService.sendStaffInvitation(invite);
    } catch (error) {
      console.error("Error in onStaffInvited:", error);
    }
  }

  /**
   * Subscription Renewal Reminder Event
   */
  static async onSubscriptionRenewal(subscription: any) {
    try {
      const tenantId = subscription.tenant_id || subscription.tenantId;
      const merchantEmails = await this.getMerchantEmails(tenantId);

      for (const email of merchantEmails) {
        await emailService.sendSubscriptionRenewal(subscription, email);
      }
    } catch (error) {
      console.error("Error in onSubscriptionRenewal:", error);
    }
  }

  /**
   * Helper: Get user preferences by user ID
   */
  private static async getUserPreferences(userId: number) {
    if (!userId) return null;
    const prefs = await db
      .selectFrom("notificationPreferences")
      .selectAll()
      .where("userId", "=", userId)
      .executeTakeFirst();

    if (!prefs) {
      return {
        emailOrderConfirmation: true,
        emailOrderStatusUpdate: true,
        emailPaymentReceipt: true,
        emailPasswordReset: true,
        emailLowStockAlert: true,
        emailSubscriptionRenewal: true,
        emailMarketing: false,
      };
    }

    return prefs;
  }

  /**
   * Helper: Get user preferences by email
   */
  private static async getUserPreferencesByEmail(email: string, tenantId: number) {
    const user = await db
      .selectFrom("users")
      .select("id")
      .where("email", "=", email)
      .executeTakeFirst();

    if (!user) return null;

    return await db
      .selectFrom("notificationPreferences")
      .selectAll()
      .where("userId", "=", user.id)
      .where("tenantId", "=", tenantId)
      .executeTakeFirst();
  }

  /**
   * Helper: Get merchant emails for a tenant
   */
  private static async getMerchantEmails(tenantId: number): Promise<string[]> {
    const tenantUsers = await db
      .selectFrom("tenantUsers")
      .innerJoin("users", "users.id", "tenantUsers.userId")
      .select("users.email")
      .where("tenantUsers.tenantId", "=", tenantId)
      .where("tenantUsers.role", "in", ["owner", "admin", "manager"])
      .execute();

    return tenantUsers.map((tu) => tu.email);
  }

  /**
   * Helper: Notify merchant about new order
   */
  private static async notifyMerchantNewOrder(order: any) {
    const tenantId = order.tenant_id || order.tenantId;
    const orderNumber = order.order_number || order.orderNumber;
    const merchantEmails = await this.getMerchantEmails(tenantId);

    for (const email of merchantEmails) {
      console.log(`Notifying merchant ${email} about new order #${orderNumber}`);
    }
  }
}

// Auto-initialize
EventListeners.init();

export default EventListeners;
