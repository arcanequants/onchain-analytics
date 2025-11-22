/**
 * Resend Email Service
 *
 * Professional email sending using Resend.com
 * Emails sent from: noreply@vectorialdata.com
 *
 * Features:
 * - Email verification
 * - Password reset
 * - Welcome emails
 * - HTML + plain text templates
 * - Error handling and logging
 *
 * Usage:
 * import { sendVerificationEmail } from '@/lib/resend'
 * await sendVerificationEmail(email, token)
 */

import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
const FROM_EMAIL = 'VectorialData <noreply@vectorialdata.com>'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vectorialdata.com'

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

/**
 * Send email using Resend
 * Handles errors gracefully and logs for debugging
 */
export async function sendEmail(options: EmailOptions) {
  try {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('[Resend] API key not configured - email not sent')
      console.warn('[Resend] To:', options.to)
      console.warn('[Resend] Subject:', options.subject)
      return { success: true, messageId: 'dev-mode-no-email' }
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
      replyTo: options.replyTo,
    })

    if (error) {
      console.error('[Resend] Email send failed:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    console.log('[Resend] Email sent successfully:', data?.id)
    return { success: true, messageId: data?.id }
  } catch (error: any) {
    console.error('[Resend] Unexpected error:', error)
    throw error
  }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  verificationToken: string
) {
  const verificationUrl = `${SITE_URL}/auth/verify-email?token=${verificationToken}`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - VectorialData</title>
  <style>
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
      background: linear-gradient(135deg, #0099ff 0%, #00ccff 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
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
      background: #0099ff;
      color: white !important;
      padding: 14px 40px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
    .button:hover {
      background: #0088ee;
    }
    .token-box {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #0099ff;
      margin: 20px 0;
      word-break: break-all;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #555;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Verify Your Email</h1>
    </div>
    <div class="content">
      <p>Welcome to <strong>VectorialData</strong>!</p>
      <p>Thank you for signing up for our onchain analytics platform. To complete your registration and activate your account, please verify your email address.</p>

      <div class="button-container">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </div>

      <p style="font-size: 14px; color: #6c757d;">Or copy and paste this link into your browser:</p>
      <div class="token-box">${verificationUrl}</div>

      <div class="warning">
        <p><strong>⚠️ Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
      </div>

      <p>If you didn't create an account with VectorialData, you can safely ignore this email.</p>

      <p style="margin-top: 30px;">Happy analyzing!<br><strong>The VectorialData Team</strong></p>
    </div>
    <div class="footer">
      <p><strong>VectorialData</strong> - OnChain Analytics Platform</p>
      <p>© ${new Date().getFullYear()} VectorialData. All rights reserved.</p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="${SITE_URL}/privacy" style="color: #0099ff; text-decoration: none;">Privacy Policy</a> •
        <a href="${SITE_URL}/terms" style="color: #0099ff; text-decoration: none;">Terms of Service</a>
      </p>
    </div>
  </div>
</body>
</html>
  `

  return sendEmail({
    to: email,
    subject: '🚀 Verify your VectorialData account',
    html,
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
) {
  const resetUrl = `${SITE_URL}/auth/reset-password?token=${resetToken}`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - VectorialData</title>
  <style>
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
      background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
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
      background: #ff6b6b;
      color: white !important;
      padding: 14px 40px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
    .button:hover {
      background: #ff5252;
    }
    .token-box {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #ff6b6b;
      margin: 20px 0;
      word-break: break-all;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #555;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔑 Reset Your Password</h1>
    </div>
    <div class="content">
      <p>We received a request to reset the password for your <strong>VectorialData</strong> account.</p>
      <p>Click the button below to choose a new password:</p>

      <div class="button-container">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>

      <p style="font-size: 14px; color: #6c757d;">Or copy and paste this link into your browser:</p>
      <div class="token-box">${resetUrl}</div>

      <div class="warning">
        <p><strong>⚠️ Important:</strong> This password reset link will expire in 1 hour for security reasons.</p>
      </div>

      <p><strong>Didn't request this?</strong> If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>

      <p style="margin-top: 30px;">Stay secure!<br><strong>The VectorialData Team</strong></p>
    </div>
    <div class="footer">
      <p><strong>VectorialData</strong> - OnChain Analytics Platform</p>
      <p>© ${new Date().getFullYear()} VectorialData. All rights reserved.</p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="${SITE_URL}/privacy" style="color: #ff6b6b; text-decoration: none;">Privacy Policy</a> •
        <a href="${SITE_URL}/terms" style="color: #ff6b6b; text-decoration: none;">Terms of Service</a>
      </p>
    </div>
  </div>
</body>
</html>
  `

  return sendEmail({
    to: email,
    subject: '🔑 Reset your VectorialData password',
    html,
  })
}

/**
 * Send welcome email (after verification)
 */
export async function sendWelcomeEmail(email: string, name?: string) {
  const dashboardUrl = `${SITE_URL}/dashboard`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to VectorialData!</title>
  <style>
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
      background: linear-gradient(135deg, #00d4aa 0%, #00ffc8 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
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
      background: #00d4aa;
      color: white !important;
      padding: 14px 40px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
    .button:hover {
      background: #00c299;
    }
    .feature {
      background: #f8f9fa;
      padding: 15px 20px;
      margin: 12px 0;
      border-radius: 6px;
      border-left: 4px solid #00d4aa;
    }
    .feature strong {
      color: #00d4aa;
      font-size: 15px;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to VectorialData!</h1>
    </div>
    <div class="content">
      <p>${name ? `Hi <strong>${name}</strong>!` : 'Hello!'}</p>
      <p>Your account is now <strong>active</strong>! You're all set to explore powerful onchain analytics.</p>

      <h3 style="color: #333; margin-top: 30px; margin-bottom: 15px;">What you can do now:</h3>

      <div class="feature">
        <strong>📊 Track Wallet Activity</strong><br>
        <span style="color: #6c757d; font-size: 14px;">Monitor wallets across Ethereum, Base, Arbitrum, Optimism, and more</span>
      </div>

      <div class="feature">
        <strong>⛽ Monitor Gas Prices</strong><br>
        <span style="color: #6c757d; font-size: 14px;">Real-time gas price tracking and historical data</span>
      </div>

      <div class="feature">
        <strong>📈 Analyze Token Prices</strong><br>
        <span style="color: #6c757d; font-size: 14px;">Track thousands of tokens with live price updates</span>
      </div>

      <div class="feature">
        <strong>📅 Crypto Events Calendar</strong><br>
        <span style="color: #6c757d; font-size: 14px;">Stay updated on token unlocks, airdrops, and major events</span>
      </div>

      <div class="feature">
        <strong>🔑 API Access</strong><br>
        <span style="color: #6c757d; font-size: 14px;">Generate API keys for programmatic access (Free: 100 calls/day)</span>
      </div>

      <div class="button-container">
        <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
      </div>

      <p style="background: #e3f2fd; padding: 15px; border-radius: 6px; border-left: 4px solid #2196f3; margin-top: 30px;">
        <strong style="color: #1976d2;">💡 Pro Tip:</strong><br>
        <span style="color: #555; font-size: 14px;">Generate your API key in the dashboard to integrate our analytics into your own applications!</span>
      </p>

      <p style="margin-top: 30px;">Questions? Just reply to this email - we're here to help!</p>

      <p>Happy analyzing!<br><strong>The VectorialData Team</strong></p>
    </div>
    <div class="footer">
      <p><strong>VectorialData</strong> - OnChain Analytics Platform</p>
      <p>© ${new Date().getFullYear()} VectorialData. All rights reserved.</p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="${SITE_URL}/privacy" style="color: #00d4aa; text-decoration: none;">Privacy Policy</a> •
        <a href="${SITE_URL}/terms" style="color: #00d4aa; text-decoration: none;">Terms of Service</a> •
        <a href="${SITE_URL}/contact" style="color: #00d4aa; text-decoration: none;">Contact Us</a>
      </p>
    </div>
  </div>
</body>
</html>
  `

  return sendEmail({
    to: email,
    subject: '🎉 Welcome to VectorialData - Your account is ready!',
    html,
  })
}

/**
 * Helper: Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}
