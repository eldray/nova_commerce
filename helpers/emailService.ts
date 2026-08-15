import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Create transporter based on environment configuration
const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('Email configuration missing. Emails will be logged to console only.');
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

const transporter = createTransporter();

/**
 * Send email with fallback to console logging if not configured
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const { to, subject, html, text } = options;

  // Validate input
  if (!to || !subject || !html) {
    return {
      success: false,
      error: 'Missing required email fields (to, subject, html)',
    };
  }

  // If transporter not configured, log to console (development mode)
  if (!transporter) {
    console.log('=== EMAIL (Development Mode) ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML: ${html}`);
    if (text) console.log(`Text: ${text}`);
    console.log('===============================');
    
    return {
      success: true,
      messageId: 'dev-mode-' + Date.now(),
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Nova Commerce" <${process.env.SMTP_FROM_EMAIL || 'noreply@novacommerce.com'}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log('Email sent successfully:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  orderTotal: number,
  items: Array<{ name: string; quantity: number; price: number }>
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .item { border-bottom: 1px solid #eee; padding: 10px 0; }
          .item:last-child { border-bottom: none; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed! 🎉</h1>
            <p>Thank you for your purchase</p>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Your order <strong>#${orderNumber}</strong> has been confirmed and is being processed.</p>
            
            <div class="order-details">
              <h3>Order Details:</h3>
              ${items.map(item => `
                <div class="item">
                  <strong>${item.name}</strong> x ${item.quantity} - GH₵${(item.price * item.quantity).toFixed(2)}
                </div>
              `).join('')}
              <div class="total">Total: GH₵${orderTotal.toFixed(2)}</div>
            </div>
            
            <p>We'll notify you once your order ships.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${orderNumber}" class="button">View Order</a>
            </div>
            
            <div class="footer">
              <p>Thank you for shopping with us!</p>
              <p>Nova Commerce Platform</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Order Confirmed! 🎉
    
    Hi ${customerName},
    
    Your order #${orderNumber} has been confirmed.
    
    Order Details:
    ${items.map(item => `- ${item.name} x ${item.quantity} - GH₵${(item.price * item.quantity).toFixed(2)}`).join('\n')}
    Total: GH₵${orderTotal.toFixed(2)}
    
    We'll notify you once your order ships.
    
    View your order: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${orderNumber}
    
    Thank you for shopping with us!
    Nova Commerce Platform
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Order Confirmation #${orderNumber}`,
    html,
    text,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  resetToken: string
): Promise<EmailResult> {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>We received a request to reset your password for your Nova Commerce account.</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>This link will expire in 1 hour.</p>
            
            <div class="warning">
              <strong>Didn't request this?</strong><br>
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </div>
            
            <div class="footer">
              <p>Nova Commerce Platform</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Password Reset Request
    
    Hi ${userName},
    
    We received a request to reset your password.
    
    Reset your password: ${resetUrl}
    
    This link will expire in 1 hour.
    
    Didn't request this? You can safely ignore this email.
    
    Nova Commerce Platform
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Password Reset Request',
    html,
    text,
  });
}

/**
 * Send staff invitation email
 */
export async function sendStaffInvitationEmail(
  staffEmail: string,
  inviterName: string,
  storeName: string,
  roleName: string,
  temporaryPassword: string
): Promise<EmailResult> {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px dashed #667eea; }
          .button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You're Invited! 🎉</h1>
            <p>Join ${storeName} on Nova Commerce</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p><strong>${inviterName}</strong> has invited you to join <strong>${storeName}</strong> as a <strong>${roleName}</strong>.</p>
            
            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${staffEmail}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 3px;">${temporaryPassword}</code></p>
              <p><em>Please change your password after logging in.</em></p>
            </div>
            
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Login to Dashboard</a>
            </div>
            
            <p>Once logged in, you'll have access to the dashboard based on your role permissions.</p>
            
            <div class="footer">
              <p>Welcome aboard!</p>
              <p>Nova Commerce Platform</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    You're Invited! 🎉
    
    ${inviterName} has invited you to join ${storeName} as a ${roleName}.
    
    Your Login Credentials:
    Email: ${staffEmail}
    Temporary Password: ${temporaryPassword}
    
    Please change your password after logging in.
    
    Login here: ${loginUrl}
    
    Welcome aboard!
    Nova Commerce Platform
  `;

  return sendEmail({
    to: staffEmail,
    subject: `You've been invited to join ${storeName}`,
    html,
    text,
  });
}

/**
 * Send welcome email to new merchant
 */
export async function sendWelcomeEmail(
  merchantEmail: string,
  merchantName: string,
  storeName: string
): Promise<EmailResult> {
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .step { margin: 15px 0; padding-left: 30px; position: relative; }
          .step:before { content: "✓"; position: absolute; left: 0; color: #667eea; font-weight: bold; }
          .button { display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Nova Commerce! 🚀</h1>
            <p>Your journey starts here</p>
          </div>
          <div class="content">
            <p>Hi ${merchantName},</p>
            <p>Congratulations on creating your store <strong>${storeName}</strong>! You're now part of a growing community of successful online merchants.</p>
            
            <div class="steps">
              <h3>Next Steps to Launch Your Store:</h3>
              <div class="step">Complete your store profile and branding</div>
              <div class="step">Add your first products</div>
              <div class="step">Configure payment methods (Paystack/Hubtel)</div>
              <div class="step">Set up delivery zones</div>
              <div class="step">Preview and publish your store</div>
            </div>
            
            <div style="text-align: center;">
              <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
            </div>
            
            <p>Need help? Our support team is always ready to assist you.</p>
            
            <div class="footer">
              <p>Let's build something amazing together!</p>
              <p>Nova Commerce Platform</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Welcome to Nova Commerce! 🚀
    
    Hi ${merchantName},
    
    Congratulations on creating your store ${storeName}!
    
    Next Steps to Launch Your Store:
    ✓ Complete your store profile and branding
    ✓ Add your first products
    ✓ Configure payment methods (Paystack/Hubtel)
    ✓ Set up delivery zones
    ✓ Preview and publish your store
    
    Go to your dashboard: ${dashboardUrl}
    
    Need help? Our support team is always ready to assist you.
    
    Let's build something amazing together!
    Nova Commerce Platform
  `;

  return sendEmail({
    to: merchantEmail,
    subject: `Welcome to Nova Commerce, ${merchantName}!`,
    html,
    text,
  });
}

/**
 * Send order status update email
 */
export async function sendOrderStatusUpdateEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  oldStatus: string,
  newStatus: string
): Promise<EmailResult> {
  const statusEmojis: Record<string, string> = {
    'pending': '⏳',
    'confirmed': '✅',
    'processing': '🔧',
    'shipped': '🚚',
    'delivered': '🎉',
    'cancelled': '❌',
    'refunded': '💰',
  };

  const emoji = statusEmojis[newStatus.toLowerCase()] || '📦';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .status-badge { display: inline-block; padding: 8px 20px; background: #667eea; color: white; border-radius: 20px; font-weight: bold; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${emoji} Order Update</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Great news! Your order <strong>#${orderNumber}</strong> has been updated:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <span class="status-badge">${newStatus.toUpperCase()}</span>
            </div>
            
            <p>Your order status has changed from <strong>${oldStatus}</strong> to <strong>${newStatus}</strong>.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${orderNumber}" class="button">Track Order</a>
            </div>
            
            <div class="footer">
              <p>Thank you for shopping with us!</p>
              <p>Nova Commerce Platform</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Order Update ${emoji}
    
    Hi ${customerName},
    
    Your order #${orderNumber} has been updated:
    
    Status: ${newStatus.toUpperCase()}
    (Previously: ${oldStatus})
    
    Track your order: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${orderNumber}
    
    Thank you for shopping with us!
    Nova Commerce Platform
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Order #${orderNumber} Status Update: ${newStatus}`,
    html,
    text,
  });
}
