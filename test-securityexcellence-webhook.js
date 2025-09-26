const axios = require('axios');

async function testSecurityExcellenceWebhook() {
  try {
    const webhookData = {
      id: 1822,
      email: "brijesh@securityexcellence.com",
      line_items: [
        {
          product_id: "1822",
          variant_id: "1822",
          title: "Pro Bundle"
        }
      ],
      customer: {
        email: "brijesh@securityexcellence.com"
      }
    };

    console.log('🧪 Testing webhook for securityexcellence.myshopify.com...');
    console.log('📤 Sending test webhook data:', JSON.stringify(webhookData, null, 2));

    // Since we're in development mode with SKIP_WEBHOOK_VERIFICATION=true,
    // we can send with a dummy HMAC signature
    const response = await axios.post(
      'http://localhost:3000/webhooks/orders/refunded',
      webhookData,
      {
        headers: {
          'X-Shopify-Shop-Domain': 'securityexcellence.myshopify.com',
          'X-Shopify-Hmac-Sha256': 'dummy_signature_for_development',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Webhook test successful!');
    console.log('📊 Response status:', response.status);
    console.log('📋 Response data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Webhook test failed:');
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📋 Response data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('💥 Error:', error.message);
    }
  }
}

// Run the test
testSecurityExcellenceWebhook();