const { Shop } = require('./config');

async function setupShopConfiguration() {
  try {
    console.log('🔧 Setting up shop configuration for order 1822...\n');
    
    const shop = 'securitymasterclasses.myshopify.com';
    
    // Create comprehensive shop configuration
    const shopConfig = {
      shop: shop,
      isActive: true,
      learnworlds: {
        baseURL: process.env.LEARNWORLDS_API_BASE || 'https://api.learnworlds.com',
        clientId: process.env.LEARNWORLDS_CLIENT_ID || 'your_client_id',
        authToken: process.env.LEARNWORLDS_AUTH_TOKEN || 'your_auth_token'
      },
      productMapping: {
        // Map Shopify product ID to LearnWorlds product ID
        "1822": "pro_bundle_123",      // Order ID 1822 - Pro Bundle
        "pro_bundle_123": "pro_bundle_123", // LearnWorlds product ID
        "Pro Bundle": "pro_bundle_123",      // Product name mapping
        "PRO-BUNDLE-001": "pro_bundle_123", // SKU mapping
        
        // Add more mappings as needed
        "12345": "basic_course_456",  // Example additional mapping
        "67890": "premium_bundle_789" // Example additional mapping
      }
    };
    
    console.log('📝 Creating shop configuration...');
    console.log('Shop:', shop);
    console.log('Product Mappings:', JSON.stringify(shopConfig.productMapping, null, 2));
    
    // Save the configuration
    const result = await Shop.upsert(shopConfig);
    
    console.log('\n✅ Shop configuration created successfully!');
    console.log('Result:', result ? 'Configuration saved' : 'Configuration updated');
    
    // Verify the configuration was saved
    console.log('\n🔍 Verifying configuration...');
    const savedConfig = await Shop.findOne({ where: { shop } });
    
    if (savedConfig) {
      console.log('✅ Configuration found in storage');
      console.log('Shop:', savedConfig.shop);
      console.log('Is Active:', savedConfig.isActive);
      console.log('Product Mappings:', JSON.stringify(savedConfig.productMapping, null, 2));
      
      // Test the mapping function
      console.log('\n🧪 Testing product mapping...');
      
      const testCases = [
        { productId: "1822", expected: "pro_bundle_123" },
        { productId: "Pro Bundle", expected: "pro_bundle_123" },
        { productId: "PRO-BUNDLE-001", expected: "pro_bundle_123" },
        { productId: "99999", expected: null } // Should not exist
      ];
      
      testCases.forEach(({ productId, expected }) => {
        const mapped = savedConfig.productMapping[productId];
        if (mapped === expected) {
          console.log(`✅ Product ID "${productId}" correctly maps to "${mapped}"`);
        } else {
          console.log(`❌ Product ID "${productId}" maps to "${mapped}" (expected: ${expected})`);
        }
      });
      
    } else {
      console.log('❌ Configuration not found after saving!');
    }
    
    console.log('\n🎯 Configuration complete!');
    console.log('Next step: Test with your webhook using:');
    console.log('   node test-order-1822.js');
    
  } catch (error) {
    console.error('❌ Error setting up shop configuration:', error);
  }
}

// Run the setup
setupShopConfiguration();