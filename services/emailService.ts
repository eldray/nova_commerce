import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { db } from '../lib/db';

// Email provider configuration
interface EmailProvider {
  name: string;
  send(mail: nodemailer.SendMailOptions): Promise<any>;
}

// SMTP Provider (Primary)
class SMTPProvider implements EmailProvider {
  name = 'SMTP';
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send(mail: nodemailer.SendMailOptions) {
    return await this.transporter.sendMail(mail);
  }
}

// SendGrid Provider (Fallback)
class SendGridProvider implements EmailProvider {
  name = 'SendGrid';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
  }

  async send(mail: nodemailer.SendMailOptions) {
    if (!this.apiKey) {
      throw new Error('SendGrid API key not configured');
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: mail.to as string }],
          subject: mail.subject,
        }],
        from: { email: mail.from as string },
        content: [{
          type: 'text/html',
          value: mail.html as string,
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid error: ${response.statusText}`);
    }

    return { messageId: 'sendgrid-' + Date.now() };
  }
}

// Email Queue for background processing
interface EmailQueueItem {
  id: string;
  to: string;
  subject: string;
  template: string;
  data: any;
  retryCount: number;
  createdAt: Date;
}

class EmailQueue {
  private queue: EmailQueueItem[] = [];
  private processing: boolean = false;
  private maxRetries: number = 3;

  async add(item: Omit<EmailQueueItem, 'id' | 'retryCount' | 'createdAt'>) {
    const queueItem: EmailQueueItem = {
      ...item,
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      retryCount: 0,
      createdAt: new Date(),
    };

    this.queue.push(queueItem);
    
    // Process queue if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return queueItem.id;
  }

  private async processQueue() {
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) continue;

      try {
        await this.sendEmail(item);
      } catch (error) {
        console.error(`Email failed for ${item.to}:`, error);
        
        // Retry logic
        if (item.retryCount < this.maxRetries) {
          item.retryCount++;
          this.queue.push(item);
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 5000 * item.retryCount));
        } else {
          // Log permanent failure
          await this.logEmailStatus(item, 'failed', error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }

    this.processing = false;
  }

  private async sendEmail(item: EmailQueueItem) {
    const emailService = EmailService.getInstance();
    const html = await emailService.renderTemplate(item.template, item.data);
    
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Nova Commerce'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@novacommerce.com'}>`,
      to: item.to,
      subject: item.subject,
      html: html,
    };

    const result = await emailService.send(mailOptions);
    
    // Log success
    await this.logEmailStatus(item, 'sent', null, result.messageId);
    
    return result;
  }

  private async logEmailStatus(
    item: EmailQueueItem, 
    status: 'sent' | 'failed' | 'pending', 
    error: string | null,
    messageId?: string
  ) {
    try {
      await db.email_logs.insert({
        recipient: item.to,
        subject: item.subject,
        template_name: item.template,
        status: status,
        error_log: error,
        message_id: messageId,
        sent_at: status === 'sent' ? new Date() : null,
      });
    } catch (dbError) {
      console.error('Failed to log email status:', dbError);
    }
  }
}

// Template Cache
const templateCache = new Map<string, string>();

export class EmailService {
  private static instance: EmailService;
  private providers: EmailProvider[] = [];
  private queue: EmailQueue;

  private constructor() {
    // Initialize providers in order of priority
    if (process.env.SMTP_HOST) {
      this.providers.push(new SMTPProvider());
    }
    if (process.env.SENDGRID_API_KEY) {
      this.providers.push(new SendGridProvider());
    }
    
    this.queue = new EmailQueue();
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send email immediately (not queued)
   */
  async send(mail: nodemailer.SendMailOptions): Promise<{ messageId: string }> {
    if (this.providers.length === 0) {
      console.warn('No email providers configured. Email not sent.');
      // In development, just log
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email (dev mode):', {
          to: mail.to,
          subject: mail.subject,
          html: mail.html?.substring(0, 200) + '...',
        });
        return { messageId: 'dev-' + Date.now() };
      }
      throw new Error('No email providers configured');
    }

    // Try providers in order
    for (const provider of this.providers) {
      try {
        const result = await provider.send(mail);
        console.log(`✅ Email sent via ${provider.name}`);
        return { messageId: result.messageId || 'unknown' };
      } catch (error) {
        console.warn(`❌ Email provider ${provider.name} failed:`, error);
        // Continue to next provider
      }
    }

    throw new Error('All email providers failed');
  }

  /**
   * Queue email for background sending
   */
  async queueEmail(
    to: string,
    subject: string,
    template: string,
    data: any
  ): Promise<string> {
    return await this.queue.add({
      to,
      subject,
      template,
      data,
    });
  }

  /**
   * Render email template with Handlebars
   */
  async renderTemplate(templateName: string, data: any): Promise<string> {
    // Check cache first
    if (templateCache.has(templateName)) {
      const cached = templateCache.get(templateName)!;
      const template = handlebars.compile(cached);
      return template(data);
    }

    // Load template from file
    const templatePath = path.join(
      process.cwd(),
      'templates',
      'emails',
      `${templateName}.html`
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Email template not found: ${templateName}`);
    }

    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    templateCache.set(templateName, templateContent);

    const template = handlebars.compile(templateContent);
    return template({
      ...data,
      companyName: process.env.COMPANY_NAME || 'Nova Commerce',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@novacommerce.com',
      currentYear: new Date().getFullYear(),
    });
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(order: any, customerEmail: string) {
    await this.queueEmail(
      customerEmail,
      `Order Confirmation - #${order.order_number}`,
      'order-confirmation',
      {
        orderNumber: order.order_number,
        orderDate: new Date(order.created_at).toLocaleDateString(),
        customerName: order.customer_name,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping_cost,
        total: order.total,
        shippingAddress: order.shipping_address,
        storeName: order.store_name,
        storeLogo: order.store_logo,
      }
    );
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(user: any, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    await this.queueEmail(
      user.email,
      'Reset Your Password',
      'password-reset',
      {
        userName: user.full_name || user.email,
        resetUrl,
        expiryHours: 1,
      }
    );
  }

  /**
   * Send welcome email to new merchant
   */
  async sendWelcomeMerchant(user: any, storeName: string) {
    await this.queueEmail(
      user.email,
      'Welcome to Nova Commerce!',
      'welcome-merchant',
      {
        userName: user.full_name || user.email,
        storeName,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
        setupGuideUrl: `${process.env.FRONTEND_URL}/setup`,
      }
    );
  }

  /**
   * Send welcome email to new customer
   */
  async sendWelcomeCustomer(user: any) {
    await this.queueEmail(
      user.email,
      'Welcome to Nova Commerce!',
      'welcome-customer',
      {
        userName: user.full_name || user.email,
        shopUrl: `${process.env.FRONTEND_URL}/shop`,
      }
    );
  }

  /**
   * Send staff invitation email
   */
  async sendStaffInvitation(invite: any) {
    const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${invite.token}`;
    
    await this.queueEmail(
      invite.email,
      `You've been invited to join ${invite.store_name}`,
      'staff-invitation',
      {
        inviterName: invite.inviter_name,
        storeName: invite.store_name,
        roleName: invite.role_name,
        inviteUrl,
        expiryDays: 7,
      }
    );
  }

  /**
   * Send low stock alert to merchant
   */
  async sendLowStockAlert(product: any, storeName: string, merchantEmail: string) {
    await this.queueEmail(
      merchantEmail,
      `Low Stock Alert: ${product.name}`,
      'low-stock-alert',
      {
        productName: product.name,
        currentStock: product.stock_quantity,
        threshold: product.low_stock_threshold,
        storeName,
        productUrl: `${process.env.FRONTEND_URL}/dashboard/products/${product.id}`,
      }
    );
  }

  /**
   * Send payment receipt
   */
  async sendPaymentReceipt(payment: any, customerEmail: string) {
    await this.queueEmail(
      customerEmail,
      `Payment Receipt - ${payment.transaction_reference}`,
      'payment-receipt',
      {
        transactionId: payment.transaction_reference,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.payment_method,
        paymentDate: new Date(payment.created_at).toLocaleDateString(),
        status: payment.status,
        orderNumber: payment.order_number,
      }
    );
  }

  /**
   * Send order status update
   */
  async sendOrderStatusUpdate(order: any, customerEmail: string, newStatus: string) {
    await this.queueEmail(
      customerEmail,
      `Order Update - #${order.order_number}`,
      'order-status-update',
      {
        orderNumber: order.order_number,
        oldStatus: order.previous_status,
        newStatus,
        trackingNumber: order.tracking_number,
        estimatedDelivery: order.estimated_delivery,
      }
    );
  }

  /**
   * Send subscription renewal reminder
   */
  async sendSubscriptionRenewal(subscription: any, merchantEmail: string) {
    await this.queueEmail(
      merchantEmail,
      'Subscription Renewal Reminder',
      'subscription-renewal',
      {
        planName: subscription.plan_name,
        renewalDate: new Date(subscription.renewal_date).toLocaleDateString(),
        amount: subscription.amount,
        currency: subscription.currency,
        billingUrl: `${process.env.FRONTEND_URL}/dashboard/billing`,
      }
    );
  }

  /**
   * Get email delivery statistics
   */
  async getDeliveryStats(tenantId: number, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await db.query(`
      SELECT 
        status,
        COUNT(*) as count,
        COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened_count
      FROM email_logs
      WHERE tenant_id = $1
        AND sent_at >= $2
      GROUP BY status
    `, [tenantId, startDate]);

    return stats;
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();

export default emailService;
