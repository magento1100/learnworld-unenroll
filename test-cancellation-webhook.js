const axios = require('axios');

// Test data for cancellation webhook
const testData = {
  id: 1822,
  email: 'vrushika.storetransform@gmail.com',
  line_items: [
    {
      product_id: 1822,
      variant_id: 456,
      name: 'Pro Bundle',
      sku: 'PRO-BUNDLE-001',
      quantity: 1
    }
  ],
  customer: {
    email: 'vrushika.storetransform@gmail.com'
  }
};

async function testCancellationWebhook() {
  console.log('🧪 Testing order cancellation webhook...\n');
  
  const webhookData = {
    topic: 'orders/cancelled',
    shop: 'securityexcellence.myshopify.com',
    body: JSON.stringify(testData)
  };
  
  console.log('📋 Test Data:');
  console.log(`   Order ID: ${testData.id}`);
  console.log(`   Email: ${testData.email}`);
  console.log(`   Product ID: ${testData.line_items[0].product_id}`);
  console.log(`   Shop: ${webhookData.shop}`);
  console.log(`   Topic: ${webhookData.topic}\n`);
  
  try {
    console.log('📤 Sending cancellation webhook request...');
    
    const response = await axios.post('http://localhost:3000/webhooks/orders/cancelled', testData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop-Domain': 'securityexcellence.myshopify.com',
        'X-Shopify-Hmac-Sha256': 'test-signature'
      }
    });
    
    console.log('📥 Response received:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.data.success && response.data.processed) {
      console.log('\n✅ Cancellation webhook processed successfully!');
      console.log('✅ Product mapping found and unenrollment attempted');
      console.log('✅ User found and unenrolled successfully');
    } else {
      console.log('\n❌ Cancellation webhook processing failed');
      console.log(`   Reason: ${response.data.reason || 'Unknown'}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error testing cancellation webhook:');
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Message: ${error.response?.data?.error || error.message}`);
    if (error.response?.data?.details) {
      console.error(`   Details: ${error.response.data.details}`);
    }
  }
}

// Run the test
testCancellationWebhook();