const crypto = require('crypto');
const { Shopify, Shop, WebhookEvent } = require('./config');
const LearnWorldsAPI = require('./learnworlds');

class WebhookHandler {
  // Verify Shopify webhook signature
  static verifyWebhookSignature(rawBody, signature, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody, 'utf8');
    const digest = hmac.digest('base64');
    return digest === signature;
  }

  // Process order refund webhook
  static async handleOrderRefund(topic, shop, body) {
    try {
      const refundData = JSON.parse(body);
      const order = refundData.order;
      
      console.log(`Processing refund for order ${order.id} from shop ${shop}`);

      // Get shop configuration
      const shopConfig = await Shop.findOne({ where: { shop } });
      if (!shopConfig || !shopConfig.isActive) {
        throw new Error('Shop not found or inactive');
      }

      // Initialize LearnWorlds API with shop-specific config
      const lwApi = new LearnWorldsAPI({
        baseURL: shopConfig.learnworldsBaseUrl,
        clientId: shopConfig.learnworldsClientId,
        authToken: shopConfig.learnworldsAuthToken
      });

      // Process each line item in the order
      const unenrollments = [];
      for (const lineItem of order.line_items) {
        // Extract product information from line item
        const productId = lineItem.product_id;
        const variantId = lineItem.variant_id;
        const quantity = lineItem.quantity;
        
        // Get customer email
        const customerEmail = order.email || order.customer?.email;
        if (!customerEmail) {
          console.warn(`No email found for order ${order.id}`);
          continue;
        }

        // Map Shopify product to LearnWorlds product
        // This assumes you have a mapping between Shopify products and LearnWorlds products
        const learnWorldsProductId = await this.mapShopifyToLearnWorlds(productId, variantId, shopConfig);
        
        if (learnWorldsProductId) {
          unenrollments.push({
            email: customerEmail,
            productId: learnWorldsProductId,
            productType: 'course', // or 'bundle' based on your mapping
            quantity: quantity
          });
        }
      }

      // Process unenrollments
      if (unenrollments.length > 0) {
        const results = await lwApi.bulkUnenrollUsers(unenrollments);
        console.log(`Processed ${results.length} unenrollments for order ${order.id}`);
        
        // Log results
        results.forEach(result => {
          if (result.success) {
            console.log(`✓ Unenrolled ${result.email} from product ${result.productId}`);
          } else {
            console.error(`✗ Failed to unenroll ${result.email} from product ${result.productId}: ${result.error}`);
          }
        });

        return {
          success: true,
          orderId: order.id,
          processedCount: results.length,
          results
        };
      } else {
        console.log(`No LearnWorlds products found in order ${order.id}`);
        return {
          success: true,
          orderId: order.id,
          processedCount: 0,
          message: 'No LearnWorlds products found'
        };
      }

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

  // Map Shopify products to LearnWorlds products
  static async mapShopifyToLearnWorlds(shopifyProductId, shopifyVariantId, shopConfig) {
    // This is a placeholder implementation
    // You should implement your own mapping logic based on your product structure
    // This could be stored in your database or configuration
    
    // Example mapping logic:
    // 1. Check if there's a direct mapping in your database
    // 2. Use product tags or metafields to store LearnWorlds product IDs
    // 3. Use product titles or SKUs to match
    
    try {
      const shopify = new Shopify.Clients.Rest(shopConfig.shop, shopConfig.accessToken);
      
      // Get product details
      const productResponse = await shopify.get({
        path: `products/${shopifyProductId}`
      });
      
      const product = productResponse.body.product;
      
      // Look for LearnWorlds product ID in product tags
      const learnWorldsTag = product.tags?.split(',').find(tag => 
        tag.trim().startsWith('learnworlds:')
      );
      
      if (learnWorldsTag) {
        return learnWorldsTag.trim().split(':')[1];
      }
      
      // Look for LearnWorlds product ID in metafields
      if (product.metafields) {
        const learnWorldsMetafield = product.metafields.find(mf => 
          mf.key === 'learnworlds_product_id'
        );
        
        if (learnWorldsMetafield) {
          return learnWorldsMetafield.value;
        }
      }
      
      // Default mapping based on product title (not recommended for production)
      // This is just for demonstration
      console.warn(`No LearnWorlds mapping found for Shopify product ${shopifyProductId}`);
      return null;
      
    } catch (error) {
      console.error(`Error mapping Shopify to LearnWorlds: ${error.message}`);
      return null;
    }
  }

  // Process incoming webhook
  static async processWebhook(topic, shop, body, signature, secret) {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(body, signature, secret)) {
      throw new Error('Invalid webhook signature');
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
      await webhookEvent.update({
        status: 'completed',
        orderId: result.orderId
      });

      return {
        processed: true,
        result
      };

    } catch (error) {
      // Update webhook status with error
      await webhookEvent.update({
        status: 'failed',
        errorMessage: error.message
      });
      
      throw error;
    }
  }
}

module.exports = WebhookHandler;