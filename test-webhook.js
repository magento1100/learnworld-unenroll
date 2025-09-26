const axios = require('axios');

// Test refund webhook
const testRefundWebhook = async () => {
  const webhookData = {
    order: {
      id: 123456789,
      email: 'test@example.com',
      line_items: [
        {
          product_id: 12345,
          variant_id: 67890,
          title: 'Test Product',
          quantity: 1,
          price: '99.99'
        }
      ],
      customer: {
        email: 'test@example.com'
      }
    }
  };

  try {
    console.log('Sending test refund webhook...');
    const response = await axios.post(
      'http://localhost:3001/webhooks/orders/refunded',
      webhookData,
      {
        headers: {
          'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
          'X-Shopify-Hmac-Sha256': 'test-signature',
          'X-Shopify-Topic': 'orders/refunded',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Webhook response:', response.data);
    console.log('Status:', response.status);
  } catch (error) {
    console.error('Webhook error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
};

testRefundWebhook();