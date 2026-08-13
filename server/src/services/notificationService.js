const { sendEmail } = require('./emailService');

/**
 * Transactional Resend Email Notification Service for E-Commerce Orders
 */
class NotificationService {
  /**
   * Dispatch Order Confirmation Receipt to Buyer
   * @param {Object} order 
   */
  static async sendOrderConfirmationNotification(order) {
    const recipientEmail = order.guest_email || (order.buyer_profile && order.buyer_profile.users ? order.buyer_profile.users.email : null);

    if (!recipientEmail) {
      console.log(`[Notification Skip] No email address found for Order ${order.id || order.order_id}`);
      return { success: false, reason: 'No recipient email' };
    }

    const orderId = order.id || order.order_id;
    const totalAmount = parseFloat(order.total_amount).toFixed(2);
    const items = order.order_items || [];

    const itemsHtml = items.map(item => {
      const title = item.product ? item.product.title : (item.title || 'Product');
      const qty = item.quantity;
      const price = parseFloat(item.price_at_purchase || item.price || 0).toFixed(2);
      const subtotal = (qty * price).toFixed(2);
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${title}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${qty}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">\$${price}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">\$${subtotal}</td>
        </tr>
      `;
    }).join('');

    const subject = `🛍️ Order Confirmation #${orderId.slice(0, 8)}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1a56db; margin-bottom: 10px;">Thank You for Your Order!</h2>
        <p>Your order <strong>#${orderId}</strong> has been successfully placed.</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p style="margin: 4px 0;"><strong>Shipping Address:</strong> ${order.shipping_address || 'N/A'}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> ${order.status || 'PENDING'}</p>
        </div>

        <h3 style="color: #2c3e50; border-bottom: 2px solid #1a56db; padding-bottom: 6px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 10px;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
              <th style="padding: 10px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; color: #1a56db;">
          Total: \$${totalAmount}
        </div>

        <br/>
        <p style="color: #64748b; font-size: 13px;">If you have any questions, reply directly to this email or contact support.</p>
        <p style="color: #334155;">Best regards,<br/><strong>The Lain-Dain Marketplace Team</strong></p>
      </div>
    `;

    return sendEmail({ to: recipientEmail, subject, html });
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
