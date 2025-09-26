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
      // Handle both direct order data and refund data with order property
      const order = refundData.order || refundData;
      
      if (!order || !order.id) {
        throw new Error('Invalid refund data: missing order information');
      }
      
      console.log(`\n🔄 Processing ${topic} webhook for order ${order.id} from shop ${shop}`);
      console.log(`📊 Order Details:`);
      console.log(`   Order ID: ${order.id}`);
      console.log(`   Order Name: ${order.name || 'N/A'}`);
      console.log(`   Order Number: ${order.order_number || 'N/A'}`);
      console.log(`   Financial Status: ${order.financial_status || 'N/A'}`);
      console.log(`   Fulfillment Status: ${order.fulfillment_status || 'N/A'}`);
      console.log(`   Created At: ${order.created_at || 'N/A'}`);
      console.log(`   Updated At: ${order.updated_at || 'N/A'}`);
      
      // Extract customer information
      const customerEmail = order.email || order.customer?.email;
      const customerFirstName = order.customer?.first_name || 'N/A';
      const customerLastName = order.customer?.last_name || 'N/A';
      const customerId = order.customer?.id || 'N/A';
      
      console.log(`👤 Customer Details:`);
      console.log(`   Email: ${customerEmail || 'N/A'}`);
      console.log(`   Name: ${customerFirstName} ${customerLastName}`);
      console.log(`   Customer ID: ${customerId}`);
      
      // Extract line items with detailed information
      const lineItems = order.line_items || [];
      console.log(`📦 Line Items (${lineItems.length}):`);
      lineItems.forEach((item, index) => {
        console.log(`   Item ${index + 1}:`);
        console.log(`     Product ID: ${item.product_id || 'N/A'}`);
        console.log(`     Variant ID: ${item.variant_id || 'N/A'}`);
        console.log(`     Title: ${item.title || 'N/A'}`);
        console.log(`     Name: ${item.name || 'N/A'}`);
        console.log(`     SKU: ${item.sku || 'N/A'}`);
        console.log(`     Quantity: ${item.quantity || 'N/A'}`);
        console.log(`     Price: ${item.price || 'N/A'}`);
        console.log(`     Total Discount: ${item.total_discount || 'N/A'}`);
      });

      // Get shop configuration
      const shopConfig = await Shop.findOne({ where: { shop } });
      console.log(`\n🏪 Shop Configuration:`);
      console.log(`   Shop Found: ${!!shopConfig}`);
      if (shopConfig) {
        console.log(`   Shop Domain: ${shopConfig.shop}`);
        console.log(`   Is Active: ${shopConfig.isActive}`);
        console.log(`   Product Mappings: ${Object.keys(shopConfig.productMapping || {}).length} mappings`);
        console.log(`   Available Mappings:`, JSON.stringify(shopConfig.productMapping, null, 2));
      }
      
      if (!shopConfig || !shopConfig.isActive) {
        throw new Error(`Shop not found or inactive: ${shop}`);
      }

      // Initialize LearnWorlds API
      const lwApi = new LearnWorldsAPI(shopConfig.learnworlds);

      // Process all line items
      const processedItems = [];
      const unenrollmentResults = [];
      
      if (lineItems.length === 0) {
        console.log(`❌ No line items found in order ${order.id}`);
        return {
          success: false,
          orderId: order.id,
          message: 'No line items found in order'
        };
      }

      // Validate customer email
      if (!customerEmail) {
        console.log(`❌ No customer email found for order ${order.id}`);
        return {
          success: false,
          orderId: order.id,
          message: 'No customer email found'
        };
      }

      // Process each line item
      for (const lineItem of lineItems) {
        console.log(`\n🔍 Processing line item: productId=${lineItem.product_id}, variantId=${lineItem.variant_id}`);
        
        // Try to map product using different identifiers
        const productIdentifiers = [
          lineItem.product_id,
          lineItem.variant_id,
          lineItem.sku,
          lineItem.name,
          lineItem.title
        ].filter(id => id && id !== 'N/A');
        
        console.log(`   Attempting to map with identifiers:`, productIdentifiers);
        
        let learnWorldsProductId = null;
        let mappedIdentifier = null;
        
        for (const identifier of productIdentifiers) {
          const mappedId = await this.mapShopifyToLearnWorlds(identifier, shopConfig);
          if (mappedId) {
            learnWorldsProductId = mappedId;
            mappedIdentifier = identifier;
            break;
          }
        }
        
        if (!learnWorldsProductId) {
          console.log(`   ⚠️  No LearnWorlds product mapping found for any identifier`);
          processedItems.push({
            productId: lineItem.product_id,
            variantId: lineItem.variant_id,
            name: lineItem.name,
            success: false,
            message: 'No LearnWorlds product mapping found'
          });
          continue;
        }

        console.log(`   ✅ Found mapping: ${mappedIdentifier} -> ${learnWorldsProductId}`);

        // Make API call to unenroll user
        console.log(`   🚀 Making unenrollment API call: ${customerEmail} from LearnWorlds product ${learnWorldsProductId}`);
        
        try {
          const result = await lwApi.unenrollUser(customerEmail, learnWorldsProductId, 'course');
          console.log(`   ✅ Successfully unenrolled ${customerEmail} from product ${learnWorldsProductId}`);
          
          processedItems.push({
            productId: lineItem.product_id,
            variantId: lineItem.variant_id,
            name: lineItem.name,
            learnWorldsProductId,
            success: true,
            result
          });
          
          unenrollmentResults.push({
            email: customerEmail,
            productId: learnWorldsProductId,
            productName: lineItem.name,
            success: true
          });
          
        } catch (unenrollError) {
          console.log(`   ❌ Unenrollment failed: ${unenrollError.message}`);
          
          processedItems.push({
            productId: lineItem.product_id,
            variantId: lineItem.variant_id,
            name: lineItem.name,
            learnWorldsProductId,
            success: false,
            error: unenrollError.message
          });
          
          unenrollmentResults.push({
            email: customerEmail,
            productId: learnWorldsProductId,
            productName: lineItem.name,
            success: false,
            error: unenrollError.message
          });
        }
      }
      
      console.log(`\n📋 Unenrollment Summary:`);
      console.log(`   Total Items Processed: ${processedItems.length}`);
      console.log(`   Successful Unenrollments: ${unenrollmentResults.filter(r => r.success).length}`);
      console.log(`   Failed Unenrollments: ${unenrollmentResults.filter(r => !r.success).length}`);
      
      return {
        success: true,
        orderId: order.id,
        email: customerEmail,
        processedItems,
        unenrollmentResults,
        summary: {
          totalItems: processedItems.length,
          successful: unenrollmentResults.filter(r => r.success).length,
          failed: unenrollmentResults.filter(r => !r.success).length
        }
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
      return await this.handleOrderRefund('orders/cancelled', shop, body);
      
    } catch (error) {
      console.error(`Error processing cancellation webhook: ${error.message}`);
      throw error;
    }
  }

  // Simple mapping function - direct lookup without API calls
  static async mapShopifyToLearnWorlds(identifier, shopConfig) {
    const productMapping = shopConfig.productMapping || {};
    
    // Direct mapping lookup
    if (productMapping[identifier]) {
      console.log(`   🎯 Found mapping for identifier "${identifier}": ${productMapping[identifier]}`);
      return productMapping[identifier];
    }
    
    console.log(`   ❌ No mapping found for identifier "${identifier}"`);
    return null;
  }

  // Process incoming webhook
  static async processWebhook(topic, shop, body, signature, secret) {
    console.log(`Processing webhook: ${topic} for shop ${shop}`);
    
    // Verify webhook signature (skip verification only if explicitly configured)
    const shouldVerifySignature = process.env.SKIP_WEBHOOK_VERIFICATION !== 'true' && process.env.NODE_ENV === 'production';
    
    if (shouldVerifySignature) {
      if (!this.verifyWebhookSignature(body, signature, secret)) {
        console.log(`Webhook signature verification failed`);
        throw new Error('Invalid webhook signature');
      }
      console.log(`Webhook signature verified successfully`);
    } else {
      console.log(`Skipping webhook signature verification (SKIP_WEBHOOK_VERIFICATION=${process.env.SKIP_WEBHOOK_VERIFICATION}, NODE_ENV=${process.env.NODE_ENV})`);
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