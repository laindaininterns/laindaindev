const { sendEmail, sendOrderConfirmationEmail } = require('./emailService');

/**
 * Transactional Resend Email Notification Service for E-Commerce Orders
 */
class NotificationService {
  /**
   * Dispatch Order Confirmation Receipt to Buyer (Signed-In & Guest)
   * @param {Object} order 
   */
  static async sendOrderConfirmationNotification(order) {
    const orderId = order.id || order.order_id || '';
    const shortId = orderId.slice(0, 8).toUpperCase();
    const customerName = order.customer_name || order.buyer_name || 'Valued Customer';
    const recipientEmail = order.customer_email || order.guest_email || (order.buyer_profile && order.buyer_profile.users ? order.buyer_profile.users.email : null);
    const totalAmount = parseFloat(order.total_amount || 0).toLocaleString();

    // Print order summary to console for instant dev verification
    console.log(`📋 [DEV] ORDER SUMMARY FOR #${shortId}: Total: Rs. ${totalAmount} | Customer: ${customerName} (${recipientEmail || 'No Email / Guest'})`);

    if (!recipientEmail) {
      console.log('ℹ️ [DEV] GUEST ORDER CREATED WITHOUT EMAIL - SKIPPING EMAIL DISPATCH');
      return { success: false, reason: 'No recipient email provided' };
    }

    console.log('📧 [DEV] ORDER CONFIRMATION EMAIL DISPATCHED TO:', recipientEmail);

    try {
      const emailResult = await sendOrderConfirmationEmail({
        email: recipientEmail,
        customerName,
        orderId,
        shippingAddress: order.shipping_address || 'Delivery Address',
        region: order.region || '',
        paymentMethod: order.payment_method || 'Cash on Delivery (COD)',
        totalAmount: order.total_amount,
        items: order.order_items || [],
      });

      if (!emailResult.success) {
        const errMsg = String(emailResult.error || '').toLowerCase();
        if (errMsg.includes('suppress') || errMsg.includes('bounce') || errMsg.includes('validation_error') || errMsg.includes('invalid `to`')) {
          console.warn('⚠️ [RESEND WARNING] Could not send to recipient (likely on Resend Suppression list). Unsuppress in dashboard.');
        }
      }

      return emailResult;
    } catch (err) {
      const errMsg = (err.message || '').toLowerCase();
      if (errMsg.includes('suppress') || errMsg.includes('bounce') || errMsg.includes('validation_error') || errMsg.includes('invalid `to`')) {
        console.warn('⚠️ [RESEND WARNING] Could not send to recipient (likely on Resend Suppression list). Unsuppress in dashboard.');
      } else {
        console.warn('[Resend Non-blocking Error]:', err.message);
      }
      return { success: false, error: err.message };
    }
  }

  /**
   * Dispatch Order Item Alert to Seller
   * @param {string} sellerEmail 
   * @param {Object} itemDetails 
   */
  static async sendSellerNewItemNotification(sellerEmail, itemDetails) {
    if (!sellerEmail) return { success: false };

    const subject = `📦 New Order Line Item #${itemDetails.order_id ? itemDetails.order_id.slice(0, 8) : ''}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #059669;">New Order Item Received!</h2>
        <p>You have received a new wholesale order item to fulfill.</p>
        
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p style="margin: 4px 0;"><strong>Order ID:</strong> ${itemDetails.order_id}</p>
          <p style="margin: 4px 0;"><strong>Quantity:</strong> ${itemDetails.quantity}</p>
          <p style="margin: 4px 0;"><strong>Price at Purchase:</strong> \$${itemDetails.price_at_purchase}</p>
        </div>

        <p>Please log in to your Seller Dashboard to accept and prepare this shipment.</p>
        <br/>
        <p style="color: #334155;">Lain-Dain Vendor Operations</p>
      </div>
    `;

    return sendEmail({ to: sellerEmail, subject, html });
  }

  /**
   * Dispatch Shipping Update Notification to Buyer
   * @param {string} buyerEmail 
   * @param {string} orderId 
   * @param {string} newStatus 
   */
  static async sendShippingUpdateNotification(buyerEmail, orderId, newStatus) {
    if (!buyerEmail) return { success: false };

    const subject = `🚚 Shipping Status Update: Order #${orderId.slice(0, 8)} is now ${newStatus}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1a56db;">Shipment Progress Update</h2>
        <p>Your order <strong>#${orderId}</strong> status has been updated to:</p>
        
        <div style="background-color: #eff6ff; padding: 20px; text-align: center; border-radius: 6px; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; color: #1d4ed8;">${newStatus}</span>
        </div>

        <p>Thank you for shopping with Lain-Dain.</p>
      </div>
    `;

    return sendEmail({ to: buyerEmail, subject, html });
  }

  /**
   * Dispatch Delivery Completion Notification to Buyer
   * @param {string} buyerEmail 
   * @param {string} orderId 
   */
  static async sendDeliveryCompletionNotification(buyerEmail, orderId) {
    if (!buyerEmail) return { success: false };

    const subject = `✅ Order Delivered: #${orderId.slice(0, 8)}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #16a34a;">Your Order Has Been Delivered!</h2>
        <p>Order <strong>#${orderId}</strong> has been marked as successfully delivered.</p>
        <p>We hope you enjoy your purchase! Please feel free to leave a review on the marketplace.</p>
      </div>
    `;

    return sendEmail({ to: buyerEmail, subject, html });
  }
}

module.exports = NotificationService;
