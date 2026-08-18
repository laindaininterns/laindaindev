const { Resend } = require('resend');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config();

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const FROM_EMAIL = process.env.EMAIL_FROM || process.env.FROM_EMAIL || 'LainDain Support <support@laindain.org>';

/**
 * Global Mail Dispatcher
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!resend) {
      console.log(`[Email Mock] ${subject} queued for ${to} - RESEND_API_KEY missing.`);
      console.log('📬 [RESEND STATUS]:', { success: true, mock: true });
      return { success: true, mock: true };
    }
    const recipientList = Array.isArray(to) ? to : [to];
    let data = await resend.emails.send({ from: FROM_EMAIL, to: recipientList, subject, html });

    // Fallback to onboarding@resend.dev if custom domain is unverified in testing
    if (data.error && (JSON.stringify(data.error).includes('domain') || JSON.stringify(data.error).includes('not verified') || JSON.stringify(data.error).includes('forbidden'))) {
      console.log('ℹ️ [Resend Info] Custom domain unverified, retrying via onboarding@resend.dev');
      data = await resend.emails.send({ from: 'Lain-Dain <onboarding@resend.dev>', to: recipientList, subject, html });
    }

    if (data.error) {
      const errStr = JSON.stringify(data.error).toLowerCase();
      if (errStr.includes('suppress') || errStr.includes('bounce') || errStr.includes('validation_error') || errStr.includes('invalid `to`')) {
        console.warn('⚠️ [RESEND WARNING] Could not send to recipient (likely on Resend Suppression list). Unsuppress in dashboard.');
      } else {
        console.warn('⚠️ [RESEND API Response Error]:', data.error);
      }
      console.log('📬 [RESEND STATUS]:', { success: false, error: data.error });
      return { success: false, error: data.error.message || 'Resend API error', data };
    }

    console.log(`[Resend Email Sent] Sent to ${to}: ${subject}`, data);
    console.log('📬 [RESEND STATUS]:', { success: true, data });
    return { success: true, data };
  } catch (error) {
    const errStr = (error.message || '').toLowerCase();
    if (errStr.includes('suppress') || errStr.includes('bounce') || errStr.includes('validation_error')) {
      console.warn('⚠️ [RESEND WARNING] Could not send to recipient (likely on Resend Suppression list). Unsuppress in dashboard.');
    } else {
      console.error(`[Resend Email Error] Failed to send to ${to}:`, error);
    }
    console.log('📬 [RESEND STATUS]:', { success: false, error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Transactional: 6-digit OTP Email Verification
 */
const sendVerificationCode = async (email, code) => {
  const subject = 'Lain-Dain — Verify Your Email Address';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2c3e50;">Email Verification Code</h2>
      <p>Thank you for registering with Lain-Dain wholesale marketplace.</p>
      <p>Your 6-digit email verification code is:</p>
      <div style="background-color: #f4f6f8; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1a56db;">${code}</span>
      </div>
      <p style="color: #7f8c8d; font-size: 13px;">This verification code will expire in 24 hours. Do not share this code with anyone.</p>
      <br/>
      <p style="color: #34495e;">Best regards,<br/>The Lain-Dain Team</p>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
};

/**
 * Transactional: Seller Account Status Update (APPROVED / REJECTED)
 */
const sendSellerStatusAlert = async (email, status) => {
  const isApproved = status === 'APPROVED';
  const subject = isApproved
    ? '🎉 Your Lain-Dain Seller Account is APPROVED!'
    : 'Update regarding your Lain-Dain Seller Account Application';

  const html = isApproved
    ? `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2>Congratulations!</h2>
        <p>Your seller application has been <strong>APPROVED</strong> by our administration team.</p>
        <p>You can now log in to list products, manage wholesale inventory, and process orders.</p>
        <br/><p>Best regards,<br/>The Lain-Dain Platform Team</p>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2>Hello</h2>
        <p>Your seller application status has been updated to: <strong>REJECTED</strong>.</p>
        <p>If you believe this is an error or need clarification, please contact support.</p>
        <br/><p>Best regards,<br/>The Lain-Dain Platform Team</p>
      </div>
    `;

  return sendEmail({ to: email, subject, html });
};

/**
 * Transactional: Guest Checkout Order Receipt & Tracking Link
 */
const sendGuestReceipt = async (email, trackingToken) => {
  const subject = `Lain-Dain Order Confirmation & Tracking (#${trackingToken})`;
  const trackingUrl = `https://laindain.org/track/${trackingToken}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2>Order Confirmation & Guest Tracking</h2>
      <p>Thank you for your purchase on Lain-Dain!</p>
      <p>Your tracking reference is: <strong>${trackingToken}</strong></p>
      <p>You can view your real-time order status anytime using the link below:</p>
      <p><a href="${trackingUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1a56db; color: #ffffff; text-decoration: none; border-radius: 4px;">Track My Order</a></p>
      <br/><p>Best regards,<br/>The Lain-Dain Support Team</p>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
};

/**
 * Transactional: General Platform Welcome Email (BUYER & SELLER)
 */
const sendWelcomeEmail = async ({ email, name, role = 'BUYER' }) => {
  const isSeller = String(role).toUpperCase() === 'SELLER';
  const subject = isSeller
    ? 'Welcome to Lain-Dain — Seller Account Created'
    : 'Welcome to Lain-Dain — Wholesale Account Created';
  const displayName = name || (isSeller ? 'Valued Seller' : 'Valued Wholesale Buyer');

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #1a56db;">Welcome to Lain-Dain, ${displayName}!</h2>
      <p>Thank you for creating an account on the Lain-Dain wholesale marketplace platform.</p>
      ${
        isSeller
          ? '<p>Your seller application has been submitted and is currently being processed by our admin team.</p>'
          : '<p>You can now browse verified B2B suppliers, request quotes, and manage wholesale orders directly.</p>'
      }
      <br/>
      <p style="color: #334155;">Best regards,<br/><strong>The Lain-Dain Marketplace Team</strong></p>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
};

/**
 * Transactional: Password Reset Request Email
 */
const sendPasswordResetEmail = async (emailOrOptions, tokenOrUrl) => {
  let email, resetUrl;
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (typeof emailOrOptions === 'object' && emailOrOptions !== null) {
    email = emailOrOptions.email;
    resetUrl = emailOrOptions.resetLink || emailOrOptions.resetUrl || (emailOrOptions.resetToken ? `${baseUrl}/reset-password?token=${emailOrOptions.resetToken}` : `${baseUrl}/reset-password`);
  } else {
    email = emailOrOptions;
    resetUrl = typeof tokenOrUrl === 'string' && tokenOrUrl.startsWith('http')
      ? tokenOrUrl
      : `${baseUrl}/reset-password?token=${tokenOrUrl}`;
  }

  const subject = 'Lain-Dain — Reset Your Password';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2c3e50;">Password Reset Request</h2>
      <p>You requested a password reset for your Lain-Dain account (${email}).</p>
      <p>Please click the button below to set a new password:</p>
      <div style="margin: 25px 0;">
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1a56db; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
      </div>
      <p style="color: #7f8c8d; font-size: 13px;">If you did not request this, please ignore this email. This link will expire in 24 hours.</p>
      <br/><p style="color: #34495e;">Best regards,<br/>The Lain-Dain Team</p>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
};

/**
 * Transactional: Wholesale Order Confirmation Email (Signed-In & Guest)
 */
const sendOrderConfirmationEmail = async ({
  email,
  customerName,
  orderId,
  shippingAddress,
  region,
  paymentMethod = 'Cash on Delivery (COD)',
  totalAmount,
  items = [],
}) => {
  const shortId = (orderId || '').slice(0, 8).toUpperCase();
  const subject = `🛒 Order Confirmed: #${shortId} - Lain-Dain B2B`;

  const itemsHtml = (items || []).map((item) => {
    const title = item.products?.title || item.product?.title || item.title || item.name || 'Wholesale Catalog Product';
    const qty = item.quantity || item.qty || 1;
    const unitPrice = parseFloat(item.unit_price || item.price_at_purchase || item.price || 0).toLocaleString();
    const subtotal = parseFloat(item.subtotal || (item.quantity * (item.unit_price || item.price_at_purchase || item.price || 0))).toLocaleString();

    return `
      <tr>
        <td style="padding: 12px 14px; border-bottom: 1px solid #E9E8E2; font-size: 13px; color: #1E293B; font-weight: 500;">
          ${title}
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #E9E8E2; font-size: 13px; color: #475569; text-align: center;">
          ${qty}
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #E9E8E2; font-size: 13px; color: #475569; text-align: right; white-space: nowrap;">
          Rs. ${unitPrice}
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #E9E8E2; font-size: 13px; color: #0F172A; text-align: right; font-weight: 600; white-space: nowrap;">
          Rs. ${subtotal}
        </td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9F9F6; margin: 0; padding: 24px; color: #1E293B;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E9E8E2; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          
          <!-- Header Banner -->
          <div style="background-color: #1B3E3B; padding: 28px 32px; text-align: left;">
            <div style="display: inline-block; background-color: #85A6A3; color: #000000; font-size: 12px; font-weight: 800; padding: 4px 8px; border-radius: 6px; margin-bottom: 8px;">
              LAINDAIN
            </div>
            <h1 style="color: #FFFFFF; font-size: 22px; margin: 0 0 6px 0; font-weight: 700;">
              Wholesale Order Confirmed
            </h1>
            <p style="color: #A3C1BF; margin: 0; font-size: 13px;">
              Order Reference: <strong>#${shortId}</strong>
            </p>
          </div>

          <!-- Body Content -->
          <div style="padding: 32px;">
            <p style="font-size: 15px; line-height: 1.5; color: #334155; margin-top: 0;">
              Dear <strong>${customerName || 'Valued Customer'}</strong>,
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
              Thank you for sourcing on Lain-Dain. Your wholesale purchase order has been successfully confirmed and forwarded to the manufacturing facility for fulfillment.
            </p>

            <!-- Order Details Card -->
            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin: 24px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 4px 0; color: #64748B; width: 140px;">Order ID:</td>
                  <td style="padding: 4px 0; color: #0F172A; font-weight: 600;">#${orderId}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748B;">Customer Name:</td>
                  <td style="padding: 4px 0; color: #0F172A; font-weight: 500;">${customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748B;">Delivery Address:</td>
                  <td style="padding: 4px 0; color: #0F172A; font-weight: 500;">${shippingAddress}${region ? ` (${region})` : ''}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748B;">Payment Mode:</td>
                  <td style="padding: 4px 0; color: #1B3E3B; font-weight: 700;">💵 ${paymentMethod}</td>
                </tr>
              </table>
            </div>

            <!-- Items Table -->
            <h3 style="font-size: 15px; color: #0F172A; margin: 0 0 12px 0; font-weight: 700;">
              Ordered Items Summary
            </h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #EEF3F2; text-align: left;">
                  <th style="padding: 10px 14px; font-size: 11px; text-transform: uppercase; color: #1B3E3B; font-weight: 700; border-radius: 6px 0 0 0;">Item</th>
                  <th style="padding: 10px 14px; font-size: 11px; text-transform: uppercase; color: #1B3E3B; font-weight: 700; text-align: center;">Qty</th>
                  <th style="padding: 10px 14px; font-size: 11px; text-transform: uppercase; color: #1B3E3B; font-weight: 700; text-align: right;">Unit Price</th>
                  <th style="padding: 10px 14px; font-size: 11px; text-transform: uppercase; color: #1B3E3B; font-weight: 700; text-align: right; border-radius: 0 6px 0 0;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Grand Total Box -->
            <div style="background-color: #EEF3F2; border: 1px solid #85A6A3; border-radius: 10px; padding: 14px 18px; text-align: right; margin-bottom: 24px;">
              <span style="font-size: 13px; color: #1B3E3B; font-weight: 600; margin-right: 12px;">Total Due Upon Delivery (COD):</span>
              <span style="font-size: 20px; color: #000000; font-weight: 800;">Rs. ${parseFloat(totalAmount || 0).toLocaleString()}</span>
            </div>

            <p style="font-size: 12px; color: #64748B; line-height: 1.5; margin-bottom: 0;">
              ℹ️ Please inspect packages upon freight delivery and pay the courier representative the exact COD balance. If you need any assistance, reach out at <a href="mailto:support@laindain.org" style="color: #1B3E3B; font-weight: 600;">support@laindain.org</a>.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #F8FAFC; border-top: 1px solid #E9E8E2; padding: 18px 32px; text-align: center; font-size: 12px; color: #94A3B8;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Lain-Dain B2B Wholesale Marketplace. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};

/**
 * Legacy Support Handlers
 */
const sendSellerWelcomeEmail = async ({ email, businessName }) => {
  return sendWelcomeEmail({ email, name: businessName, role: 'SELLER' });
};

const sendSellerStatusEmail = async ({ email, businessName, status }) => {
  return sendSellerStatusAlert(email, status);
};

module.exports = {
  sendEmail,
  sendVerificationCode,
  sendSellerStatusAlert,
  sendGuestReceipt,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendSellerWelcomeEmail,
  sendSellerStatusEmail,
};

