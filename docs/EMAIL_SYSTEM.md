# Email Notification System

## Overview
The Nova Commerce platform includes a comprehensive email notification system.

## Features
- Multi-Provider Support: SMTP and SendGrid
- Queue System with retries
- Handlebars templates
- Delivery tracking
- User preferences

## Templates Created
1. order-confirmation.html
2. password-reset.html
3. welcome-merchant.html
4. welcome-customer.html
5. staff-invitation.html
6. low-stock-alert.html
7. payment-receipt.html
8. order-status-update.html
9. subscription-renewal.html

## Files Created
- services/emailService.ts
- services/eventListeners.ts
- endpoints/notifications/send_POST.ts
- endpoints/users/preferences_PUT.ts
- endpoints/admin/notifications_GET.ts
- database/015_email_notifications.sql
- templates/emails/*.html (9 templates)

## Next Steps
Run migration: psql -d nova_commerce -f database/015_email_notifications.sql
