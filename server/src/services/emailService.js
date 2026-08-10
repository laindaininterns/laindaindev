const { Resend } = require('resend');
require('dotenv').config();

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const FROM_EMAIL = process.env.FROM_EMAIL || 'LainDain <no-reply@laindain.org>';

/**
 * Global Mail Dispatcher
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!resend) {
      console.log(`[Email Mock] ${subject} queued for ${to} - RESEND_API_KEY missing.`);
      return { success: true, mock: true };
    }
    const recipientList = Array.isArray(to) ? to : [to];
    const data = await resend.emails.send({ from: FROM_EMAIL, to: recipientList, subject, html });
    console.log(`[Resend Email Sent] Sent to ${to}: ${subject}`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`[Resend Email Error] Failed to send to ${to}:`, error);
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
 * Legacy Support Handlers
 */
const sendSellerWelcomeEmail = async ({ email, businessName }) => {
  const subject = 'Welcome to Lain-Dain — Seller Onboarding Submitted';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Welcome to Lain-Dain, ${businessName}!</h2>
      <p>Your seller application is currently <strong>PENDING</strong> review.</p>
      <br/><p>Best regards,<br/>The Lain-Dain Platform Team</p>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
};

const sendSellerStatusEmail = async ({ email, businessName, status }) => {
  return sendSellerStatusAlert(email, status);
};

module.exports = {
  sendEmail,
  sendVerificationCode,
  sendSellerStatusAlert,
  sendGuestReceipt,
  sendSellerWelcomeEmail,
  sendSellerStatusEmail,
};
