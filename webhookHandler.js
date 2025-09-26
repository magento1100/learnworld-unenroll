const crypto = require('crypto');
const { Shopify, Shop, WebhookEvent } = require('./config');
const LearnWorldsAPI = require('./learnworlds');

class WebhookHandler {
  // Verify Shopify webhook signature
  static verifyWebhookSignature(rawBody, signature, secret) {
    console.log(`Verifying webhook signature:`);
    console.log(`  signature: ${signature}`);
    console.log(`  secret present: ${!!secret}`);
    console.log(`  body length: ${rawBody.length}`);
    
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody, 'utf8');
    const digest = hmac.digest('base64');
    
    console.log(`  computed digest: ${digest}`);
    console.log(`  signature match: ${digest === signature}`);
    
    return digest === signature;
  }

  // Process order refund webhook - simplified to one API call
  static async handleOrderRefund(topic, shop, body) {
    try {
      const refundData = JSON.parse(body);
      const order = refundData.order;
      
      console.log(`Processing refund for order ${order.id} from shop ${shop}`);
      console.log(`Refund data:`, JSON.stringify(refundData, null, 2));

      // Get shop configuration
      const shopConfig = await Shop.findOne({ where: { shop } });
      console.log(`Shop config found:`, !!shopConfig, shopConfig ? { shop: shopConfig.shop, isActive: shopConfig.isActive } : 'No config');
      if (!shopConfig || !shopConfig.isActive) {
        throw new Error('Shop not found or inactive');
      }

      // Initialize LearnWorlds API
      const lwApi = new LearnWorldsAPI(shopConfig.learnworlds);

      // Process the first line item only (simplified approach)
      const lineItem = order.line_items?.[0];
      if (!lineItem) {
        console.log(`No line items found in order ${order.id}`);
        return {
          success: false,
          orderId: order.id,
          message: 'No line items found in order'
        };
      }

      console.log(`Processing line item: productId=${lineItem.product_id}, variantId=${lineItem.variant_id}`);

      // Get customer email
      const customerEmail = order.email || order.customer?.email;
      if (!customerEmail) {
        console.log(`No customer email found for order ${order.id}`);
        return {
          success: false,
          orderId: order.id,
          message: 'No customer email found'
        };
      }

      // Map Shopify product to LearnWorlds product
      const learnWorldsProductId = await this.mapShopifyToLearnWorlds(lineItem.product_id, lineItem.variant_id, shopConfig);
      
      if (!learnWorldsProductId) {
        console.log(`No LearnWorlds product mapping found for Shopify product ${lineItem.product_id}`);
        return {
          success: false,
          orderId: order.id,
          message: 'No LearnWorlds product mapping found'
        };
      }

      // Make single API call to unenroll user
      console.log(`Making unenrollment API call: ${customerEmail} from LearnWorlds product ${learnWorldsProductId}`);
      const result = await lwApi.unenrollUser(customerEmail, learnWorldsProductId, 'course');
      
      console.log(`Successfully unenrolled ${customerEmail} from product ${learnWorldsProductId}`);
      
      return {
        success: true,
        orderId: order.id,
        email: customerEmail,
        productId: learnWorldsProductId,
        result
      };

    } catch (error) {
      console.error(`Error processing refund webhook: ${error.message}`);
      throw error;
    }
  }

  // Process order cancellation webhook
  static async handleOrderCancellation(topic, shop, body) {
    try {
      const orderData = JSON.parse(body);
      const order = orderData;
      
      console.log(`Processing cancellation for order ${order.id} from shop ${shop}`);

      // Cancellation handling is similar to refund
      // You might want to implement different logic based on your business rules
      return await this.handleOrderRefund(topic, shop, body);
      
    } catch (error) {
      console.error(`Error processing cancellation webhook: ${error.message}`);
      throw error;
    }
  }

  // Simple mapping function - direct lookup without API calls
  static async mapShopifyToLearnWorlds(shopifyProductId, shopifyVariantId, shopConfig) {
    // Simple direct mapping from configuration
    const productMapping = shopConfig.productMapping || {};
    
    // Try product ID mapping first
    if (productMapping[shopifyProductId]) {
      return productMapping[shopifyProductId];
    }
    
    // Try variant ID mapping if no product mapping found
    if (productMapping[shopifyVariantId]) {
      return productMapping[shopifyVariantId];
    }
    
    // No mapping found
    return null;
  }

  // Process incoming webhook
  static async processWebhook(topic, shop, body, signature, secret) {
    console.log(`Processing webhook: ${topic} for shop ${shop}`);
    
    // Verify webhook signature (skip verification in development mode for testing)
    if (process.env.NODE_ENV !== 'development' || !process.env.SKIP_WEBHOOK_VERIFICATION) {
      if (!this.verifyWebhookSignature(body, signature, secret)) {
        console.log(`Webhook signature verification failed`);
        throw new Error('Invalid webhook signature');
      }
      console.log(`Webhook signature verified successfully`);
    } else {
      console.log(`Skipping webhook signature verification (development mode)`);
    }

    // Check if webhook was already processed
    const webhookId = crypto.createHash('sha256').update(`${topic}-${shop}-${body}`).digest('hex');
    const existingWebhook = await WebhookEvent.findOne({ where: { webhookId } });
    
    if (existingWebhook) {
      console.log(`Webhook ${webhookId} already processed`);
      return { processed: false, reason: 'Already processed' };
    }

    // Create webhook event record
    const webhookEvent = await WebhookEvent.create({
      webhookId,
      shop,
      topic,
      status: 'processing'
    });

    try {
      let result;
      
      switch (topic) {
        case 'orders/partially_refunded':
        case 'orders/refunded':
          result = await this.handleOrderRefund(topic, shop, body);
          break;
        case 'orders/cancelled':
          result = await this.handleOrderCancellation(topic, shop, body);
          break;
        default:
          throw new Error(`Unhandled webhook topic: ${topic}`);
      }

      // Update webhook status
      await WebhookEvent.update({
        webhookId: webhookEvent.webhookId,
        status: 'completed',
        orderId: result.orderId
      });

      return {
        processed: true,
        result
      };

    } catch (error) {
      // Update webhook status with error
      await WebhookEvent.update({
        webhookId: webhookEvent.webhookId,
        status: 'failed',
        errorMessage: error.message
      });
      
      throw error;
    }
  }
}

module.exports = WebhookHandler;