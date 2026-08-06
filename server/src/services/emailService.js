const { Resend } = require('resend');
require('dotenv').config();

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

/**
 * Send welcome email to a newly registered seller
 */
const sendSellerWelcomeEmail = async ({ email, businessName }) => {
  try {
    if (!resend) {
      console.log(`[Email Mock] Welcome email queued for ${businessName} (${email}) - RESEND_API_KEY missing.`);
      return { success: true, mock: true };
    }

    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'Welcome to Lain-Dain — Seller Onboarding Submitted',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to Lain-Dain, ${businessName}!</h2>
          <p>Thank you for submitting your seller registration application on Lain-Dain.</p>
          <p>Your application is currently <strong>PENDING</strong> verification by our administration team.</p>
          <p>Once your KYC document and business application are reviewed, you will receive an update email notifying you of your account status.</p>
          <br/>
          <p>Best regards,<br/>The Lain-Dain Platform Team</p>
        </div>
      `,
    });

    console.log(`[Resend Email Sent] Welcome email sent to ${email}`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`[Resend Email Error] Failed to send welcome email to ${email}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Send status update email (APPROVED or REJECTED) to seller
 */
const sendSellerStatusEmail = async ({ email, businessName, status }) => {
  try {
    if (!resend) {
      console.log(`[Email Mock] Status update email (${status}) queued for ${businessName} (${email}) - RESEND_API_KEY missing.`);
      return { success: true, mock: true };
    }

    const isApproved = status === 'APPROVED';
    const subject = isApproved
      ? '🎉 Your Lain-Dain Seller Account is APPROVED!'
      : 'Update regarding your Lain-Dain Seller Account Application';

    const htmlContent = isApproved
      ? `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Congratulations, ${businessName}!</h2>
          <p>Your seller application has been <strong>APPROVED</strong> by our administration team.</p>
          <p>You can now log in to your dashboard to list products, manage inventory, and receive purchase orders.</p>
          <br/>
          <p>Best regards,<br/>The Lain-Dain Platform Team</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hello, ${businessName}</h2>
          <p>Thank you for applying to be a seller on Lain-Dain.</p>
          <p>After careful review, your application status has been set to: <strong>REJECTED</strong>.</p>
          <p>If you believe this is an error or have questions, please reach out to our support team.</p>
          <br/>
          <p>Best regards,<br/>The Lain-Dain Platform Team</p>
        </div>
      `;

    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject,
      html: htmlContent,
    });

    console.log(`[Resend Email Sent] Status email (${status}) sent to ${email}`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`[Resend Email Error] Failed to send status email to ${email}:`, error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendSellerWelcomeEmail,
  sendSellerStatusEmail,
};
