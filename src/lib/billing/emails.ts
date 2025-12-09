/**
 * Billing Transactional Emails
 *
 * Email notifications for subscription lifecycle events
 *
 * Phase 2, Week 5 - SRE Audit Implementation
 */

import { sendEmail } from '../resend';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vectorialdata.com';

// ================================================================
// TYPES
// ================================================================

export interface SubscriptionEmailParams {
  email: string;
  name?: string;
  planName: string;
  planPrice?: string;
}

export interface PaymentEmailParams {
  email: string;
  name?: string;
  amount: number;
  currency: string;
  invoiceId?: string;
  invoiceUrl?: string;
}

export interface TrialEmailParams {
  email: string;
  name?: string;
  trialEndDate: Date;
  planName: string;
}

// ================================================================
// EMAIL TEMPLATES - BASE STYLES
// ================================================================

const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    margin: 0;
    padding: 0;
    background-color: #f4f4f4;
  }
  .container {
    max-width: 600px;
    margin: 40px auto;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  .header {
    padding: 40px 30px;
    text-align: center;
    color: white;
  }
  .header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
  }
  .content {
    padding: 40px 30px;
  }
  .content p {
    margin: 0 0 20px 0;
    font-size: 16px;
    line-height: 1.6;
  }
  .button-container {
    text-align: center;
    margin: 30px 0;
  }
  .button {
    display: inline-block;
    color: white !important;
    padding: 14px 40px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 16px;
  }
  .info-box {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 6px;
    margin: 20px 0;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #e9ecef;
  }
  .info-row:last-child {
    border-bottom: none;
  }
  .warning {
    background: #fff3cd;
    border-left: 4px solid #ffc107;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
  }
  .warning p {
    margin: 0;
    color: #856404;
    font-size: 14px;
  }
  .success {
    background: #d4edda;
    border-left: 4px solid #28a745;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
  }
  .success p {
    margin: 0;
    color: #155724;
    font-size: 14px;
  }
  .footer {
    background: #f8f9fa;
    padding: 30px;
    text-align: center;
    color: #6c757d;
    font-size: 13px;
  }
  .footer p {
    margin: 5px 0;
  }
  @media only screen and (max-width: 600px) {
    .container {
      margin: 0;
      border-radius: 0;
    }
    .header, .content, .footer {
      padding: 30px 20px;
    }
  }
`;

function footerHtml(accentColor: string = '#0099ff'): string {
  return `
    <div class="footer">
      <p><strong>VectorialData</strong> - AI Perception Engineering</p>
      <p>&copy; ${new Date().getFullYear()} VectorialData. All rights reserved.</p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="${SITE_URL}/privacy" style="color: ${accentColor}; text-decoration: none;">Privacy Policy</a> &bull;
        <a href="${SITE_URL}/terms" style="color: ${accentColor}; text-decoration: none;">Terms of Service</a> &bull;
        <a href="${SITE_URL}/billing" style="color: ${accentColor}; text-decoration: none;">Manage Subscription</a>
      </p>
    </div>
  `;
}

// ================================================================
// WELCOME EMAIL (New Subscription)
// ================================================================

export async function sendSubscriptionWelcomeEmail(params: SubscriptionEmailParams) {
  const { email, name, planName, planPrice } = params;
  const dashboardUrl = `${SITE_URL}/dashboard`;
  const billingUrl = `${SITE_URL}/billing`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${planName}!</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #00d4aa 0%, #00ffc8 100%);">
      <h1>Welcome to ${planName}!</h1>
    </div>
    <div class="content">
      <p>${name ? `Hi <strong>${name}</strong>!` : 'Hello!'}</p>
      <p>Thank you for subscribing to <strong>${planName}</strong>! Your subscription is now active and you have full access to all premium features.</p>

      <div class="success">
        <p><strong>Your subscription is active!</strong> You now have access to all ${planName} features.</p>
      </div>

      <div class="info-box">
        <div class="info-row">
          <span><strong>Plan</strong></span>
          <span>${planName}</span>
        </div>
        ${planPrice ? `
        <div class="info-row">
          <span><strong>Price</strong></span>
          <span>${planPrice}/month</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span><strong>Status</strong></span>
          <span style="color: #28a745;">Active</span>
        </div>
      </div>

      <h3 style="color: #333; margin-top: 30px;">What's included:</h3>
      <ul style="color: #555; padding-left: 20px;">
        <li>Unlimited AI brand analyses</li>
        <li>Priority AI processing</li>
        <li>Advanced analytics dashboard</li>
        <li>API access with higher rate limits</li>
        <li>Priority email support</li>
      </ul>

      <div class="button-container">
        <a href="${dashboardUrl}" class="button" style="background: #00d4aa;">Go to Dashboard</a>
      </div>

      <p style="font-size: 14px; color: #6c757d; text-align: center;">
        <a href="${billingUrl}" style="color: #0099ff;">Manage your subscription</a>
      </p>

      <p style="margin-top: 30px;">Questions? Just reply to this email - we're here to help!</p>

      <p>Happy analyzing!<br><strong>The VectorialData Team</strong></p>
    </div>
    ${footerHtml('#00d4aa')}
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: `Welcome to ${planName} - Your subscription is active!`,
    html,
  });
}

// ================================================================
// PAYMENT RECEIPT EMAIL
// ================================================================

export async function sendPaymentReceiptEmail(params: PaymentEmailParams) {
  const { email, name, amount, currency, invoiceId, invoiceUrl } = params;
  const billingUrl = `${SITE_URL}/billing`;

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #0099ff 0%, #00ccff 100%);">
      <h1>Payment Receipt</h1>
    </div>
    <div class="content">
      <p>${name ? `Hi <strong>${name}</strong>!` : 'Hello!'}</p>
      <p>Thank you for your payment. Here's your receipt for your records.</p>

      <div class="success">
        <p><strong>Payment successful!</strong> Your subscription remains active.</p>
      </div>

      <div class="info-box">
        <div class="info-row">
          <span><strong>Amount Paid</strong></span>
          <span style="font-size: 18px; font-weight: bold; color: #28a745;">${formattedAmount}</span>
        </div>
        <div class="info-row">
          <span><strong>Date</strong></span>
          <span>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        ${invoiceId ? `
        <div class="info-row">
          <span><strong>Invoice ID</strong></span>
          <span style="font-family: monospace;">${invoiceId}</span>
        </div>
        ` : ''}
      </div>

      ${invoiceUrl ? `
      <div class="button-container">
        <a href="${invoiceUrl}" class="button" style="background: #0099ff;">View Invoice</a>
      </div>
      ` : ''}

      <p style="font-size: 14px; color: #6c757d; text-align: center;">
        <a href="${billingUrl}" style="color: #0099ff;">View billing history</a>
      </p>

      <p style="margin-top: 30px;">Thank you for being a VectorialData customer!</p>

      <p>Best regards,<br><strong>The VectorialData Team</strong></p>
    </div>
    ${footerHtml('#0099ff')}
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: `Payment Receipt - ${formattedAmount}`,
    html,
  });
}

// ================================================================
// PAYMENT FAILED EMAIL
// ================================================================

export async function sendPaymentFailedEmail(params: PaymentEmailParams & { retryDate?: Date }) {
  const { email, name, amount, currency, retryDate } = params;
  const billingUrl = `${SITE_URL}/billing`;

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Failed</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);">
      <h1>Payment Failed</h1>
    </div>
    <div class="content">
      <p>${name ? `Hi <strong>${name}</strong>,` : 'Hello,'}</p>
      <p>We were unable to process your payment of <strong>${formattedAmount}</strong> for your VectorialData subscription.</p>

      <div class="warning">
        <p><strong>Action Required:</strong> Please update your payment method to avoid service interruption.</p>
      </div>

      <div class="info-box">
        <div class="info-row">
          <span><strong>Amount Due</strong></span>
          <span style="color: #dc3545;">${formattedAmount}</span>
        </div>
        ${retryDate ? `
        <div class="info-row">
          <span><strong>Next Retry</strong></span>
          <span>${retryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        ` : ''}
      </div>

      <h3 style="color: #333;">Common reasons for payment failure:</h3>
      <ul style="color: #555; padding-left: 20px;">
        <li>Expired credit card</li>
        <li>Insufficient funds</li>
        <li>Card declined by bank</li>
        <li>Outdated billing information</li>
      </ul>

      <div class="button-container">
        <a href="${billingUrl}" class="button" style="background: #ff6b6b;">Update Payment Method</a>
      </div>

      <p style="font-size: 14px; color: #6c757d;">If you've already updated your payment method, you can ignore this email. We'll retry the payment automatically.</p>

      <p style="margin-top: 30px;">Need help? Reply to this email and we'll assist you.</p>

      <p>Best regards,<br><strong>The VectorialData Team</strong></p>
    </div>
    ${footerHtml('#ff6b6b')}
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: `Action Required: Payment Failed - ${formattedAmount}`,
    html,
  });
}

// ================================================================
// TRIAL ENDING EMAIL
// ================================================================

export async function sendTrialEndingEmail(params: TrialEmailParams) {
  const { email, name, trialEndDate, planName } = params;
  const billingUrl = `${SITE_URL}/billing`;
  const pricingUrl = `${SITE_URL}/pricing`;

  const daysLeft = Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Trial is Ending Soon</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #ffc107 0%, #ffdb4d 100%);">
      <h1 style="color: #333;">Trial Ending Soon</h1>
    </div>
    <div class="content">
      <p>${name ? `Hi <strong>${name}</strong>,` : 'Hello,'}</p>
      <p>Your <strong>${planName}</strong> trial is ending in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>.</p>

      <div class="warning">
        <p><strong>Trial ends:</strong> ${trialEndDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <h3 style="color: #333;">Don't lose access to:</h3>
      <ul style="color: #555; padding-left: 20px;">
        <li>Unlimited AI brand analyses</li>
        <li>Priority AI processing</li>
        <li>Advanced analytics dashboard</li>
        <li>API access with higher rate limits</li>
        <li>Priority email support</li>
      </ul>

      <div class="button-container">
        <a href="${billingUrl}" class="button" style="background: #ffc107; color: #333 !important;">Add Payment Method</a>
      </div>

      <p style="font-size: 14px; color: #6c757d; text-align: center;">
        <a href="${pricingUrl}" style="color: #0099ff;">View all plans</a>
      </p>

      <p style="background: #e3f2fd; padding: 15px; border-radius: 6px; border-left: 4px solid #2196f3; margin-top: 30px;">
        <strong style="color: #1976d2;">No commitment:</strong><br>
        <span style="color: #555; font-size: 14px;">You can cancel anytime. We'll remind you before each billing cycle.</span>
      </p>

      <p style="margin-top: 30px;">Questions? Reply to this email - we're happy to help!</p>

      <p>Best regards,<br><strong>The VectorialData Team</strong></p>
    </div>
    ${footerHtml('#ffc107')}
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: `Your ${planName} trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
    html,
  });
}

// ================================================================
// CANCELLATION CONFIRMATION EMAIL
// ================================================================

export async function sendCancellationConfirmationEmail(params: SubscriptionEmailParams & { endDate: Date }) {
  const { email, name, planName, endDate } = params;
  const pricingUrl = `${SITE_URL}/pricing`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Cancellation Confirmed</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #6c757d 0%, #868e96 100%);">
      <h1>Cancellation Confirmed</h1>
    </div>
    <div class="content">
      <p>${name ? `Hi <strong>${name}</strong>,` : 'Hello,'}</p>
      <p>We've received your request to cancel your <strong>${planName}</strong> subscription.</p>

      <div class="info-box">
        <div class="info-row">
          <span><strong>Plan</strong></span>
          <span>${planName}</span>
        </div>
        <div class="info-row">
          <span><strong>Access Until</strong></span>
          <span>${endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="info-row">
          <span><strong>Status</strong></span>
          <span style="color: #ffc107;">Cancelling</span>
        </div>
      </div>

      <p><strong>What happens next:</strong></p>
      <ul style="color: #555; padding-left: 20px;">
        <li>You'll continue to have full access until ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</li>
        <li>You won't be charged again</li>
        <li>After cancellation, you'll be moved to our Free plan</li>
        <li>Your data will be preserved</li>
      </ul>

      <p style="background: #e3f2fd; padding: 15px; border-radius: 6px; border-left: 4px solid #2196f3; margin-top: 30px;">
        <strong style="color: #1976d2;">Changed your mind?</strong><br>
        <span style="color: #555; font-size: 14px;">You can resubscribe anytime to get your premium features back instantly.</span>
      </p>

      <div class="button-container">
        <a href="${pricingUrl}" class="button" style="background: #0099ff;">Resubscribe</a>
      </div>

      <p style="margin-top: 30px;">We'd love to hear your feedback. What could we have done better? Just reply to this email.</p>

      <p>Thank you for being a VectorialData customer!</p>

      <p>Best regards,<br><strong>The VectorialData Team</strong></p>
    </div>
    ${footerHtml('#6c757d')}
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: `Your ${planName} subscription has been cancelled`,
    html,
  });
}

// ================================================================
// SUBSCRIPTION CANCELLED (Final) EMAIL
// ================================================================

export async function sendSubscriptionEndedEmail(params: SubscriptionEmailParams) {
  const { email, name, planName } = params;
  const pricingUrl = `${SITE_URL}/pricing`;
  const dashboardUrl = `${SITE_URL}/dashboard`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Ended</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #6c757d 0%, #868e96 100%);">
      <h1>Subscription Ended</h1>
    </div>
    <div class="content">
      <p>${name ? `Hi <strong>${name}</strong>,` : 'Hello,'}</p>
      <p>Your <strong>${planName}</strong> subscription has ended. You've been moved to our Free plan.</p>

      <div class="info-box">
        <div class="info-row">
          <span><strong>Current Plan</strong></span>
          <span>Free</span>
        </div>
        <div class="info-row">
          <span><strong>Previous Plan</strong></span>
          <span>${planName}</span>
        </div>
      </div>

      <h3 style="color: #333;">What you still have access to:</h3>
      <ul style="color: #555; padding-left: 20px;">
        <li>3 AI brand analyses per month</li>
        <li>Basic analytics dashboard</li>
        <li>100 API calls per day</li>
        <li>Community support</li>
      </ul>

      <p style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107;">
        <strong style="color: #856404;">Miss your premium features?</strong><br>
        <span style="color: #555; font-size: 14px;">Resubscribe anytime to get unlimited analyses, priority processing, and more.</span>
      </p>

      <div class="button-container">
        <a href="${pricingUrl}" class="button" style="background: #00d4aa;">View Plans</a>
      </div>

      <p style="font-size: 14px; color: #6c757d; text-align: center;">
        <a href="${dashboardUrl}" style="color: #0099ff;">Continue with Free plan</a>
      </p>

      <p style="margin-top: 30px;">We hope to see you back soon!</p>

      <p>Best regards,<br><strong>The VectorialData Team</strong></p>
    </div>
    ${footerHtml('#6c757d')}
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: `Your ${planName} subscription has ended`,
    html,
  });
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  sendSubscriptionWelcomeEmail,
  sendPaymentReceiptEmail,
  sendPaymentFailedEmail,
  sendTrialEndingEmail,
  sendCancellationConfirmationEmail,
  sendSubscriptionEndedEmail,
};
