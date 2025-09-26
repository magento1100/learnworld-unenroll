const axios = require('axios');

// Test the complete unenrollment flow
async function testUnenrollmentFlow() {
  try {
    console.log('🧪 Testing complete unenrollment flow...\n');
    
    // Test data based on your actual order
    const testData = {
      order_id: 1822,
      email: 'vrushika.storetransform@gmail.com',
      product_id: '1822', // This should map to pro_bundle_123
      shop_domain: 'securityexcellence.myshopify.com',
      topic: 'orders/refunded'
    };

    console.log('📋 Test Data:');
    console.log(`   Order ID: ${testData.order_id}`);
    console.log(`   Email: ${testData.email}`);
    console.log(`   Product ID: ${testData.product_id}`);
    console.log(`   Shop: ${testData.shop_domain}`);
    console.log(`   Topic: ${testData.topic}`);
    console.log('');

    // Create webhook payload
    const webhookPayload = {
      id: testData.order_id,
      email: testData.email,
      line_items: [
        {
          product_id: testData.product_id,
          name: 'Pro Bundle'
        }
      ]
    };

    console.log('📤 Sending webhook request...');
    
    // Send webhook request
    const response = await axios.post('http://localhost:3000/webhooks/orders/refunded', webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop-Domain': testData.shop_domain,
        'X-Shopify-Hmac-Sha256': 'invalid_signature_for_testing'
      }
    });

    console.log('📥 Response received:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Data:`, JSON.stringify(response.data, null, 2));
    
    // Analyze the response
    if (response.data.success) {
      console.log('\n✅ Webhook processed successfully!');
      
      if (response.data.processed) {
        console.log('✅ Product mapping found and unenrollment attempted');
        
        if (response.data.learnworlds?.message?.includes('not found')) {
          console.log('⚠️  User not found in LearnWorlds (this is expected for test data)');
        } else {
          console.log('✅ User found and unenrolled successfully');
        }
      } else {
        console.log('⚠️  Product mapping not found or invalid');
      }
    } else {
      console.log('\n❌ Webhook processing failed');
      console.log('Error:', response.data.error);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    if (error.response) {
      console.log('Response error:', error.response.data);
      console.log('Status:', error.response.status);
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Run the test
testUnenrollmentFlow();