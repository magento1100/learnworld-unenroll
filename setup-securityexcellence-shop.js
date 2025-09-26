const { Shop } = require('./config');

async function setupSecurityExcellenceShop() {
  try {
    console.log('🔧 Setting up Security Excellence shop configuration...\n');
    
    const shop = 'securityexcellence.myshopify.com';
    
    // Create comprehensive shop configuration
    const shopConfig = {
      shop: shop,
      isActive: true,
      learnworlds: {
        baseURL: process.env.LEARNWORLDS_API_BASE || 'https://securitymasterclasses.securityexcellence.net/admin/api/v2',
        clientId: process.env.LEARNWORLDS_CLIENT_ID || '64facb2d6072346ff30ed226',
        authToken: process.env.LEARNWORLDS_AUTH_TOKEN || 'your_auth_token'
      },
      productMapping: {
        // Map Shopify product ID to LearnWorlds product ID
        "1822": "pro_bundle_123",      // Order ID 1822 - Pro Bundle
        "12345": "basic_course_456",   // Basic Course
        "67890": "premium_bundle_789", // Premium Bundle
        "pro_bundle_123": "pro_bundle_123", // LearnWorlds product ID
        "Pro Bundle": "pro_bundle_123",      // Product name mapping
        "PRO-BUNDLE-001": "pro_bundle_123", // SKU mapping
        "basic_course_456": "basic_course_456",
        "Basic Course": "basic_course_456",
        "BASIC-COURSE-001": "basic_course_456",
        "premium_bundle_789": "premium_bundle_789",
        "Premium Bundle": "premium_bundle_789",
        "PREMIUM-BUNDLE-001": "premium_bundle_789"
      }
    };
    
    console.log('📝 Creating shop configuration...');
    console.log('Shop:', shop);
    console.log('Product Mappings:', JSON.stringify(shopConfig.productMapping, null, 2));
    
    // Save the configuration
    const result = await Shop.upsert(shopConfig);
    
    console.log('\n✅ Security Excellence shop configuration created successfully!');
    console.log('Result:', result ? 'Configuration saved' : 'Configuration updated');
    
    // Verify the configuration was saved
    console.log('\n🔍 Verifying configuration...');
    const savedConfig = await Shop.findOne({ where: { shop } });
    
    if (savedConfig) {
      console.log('✅ Configuration found in storage');
      console.log('Shop:', savedConfig.shop);
      console.log('Is Active:', savedConfig.isActive);
      console.log('LearnWorlds API Configured:', !!savedConfig.learnworlds);
      console.log('Product Mappings Count:', Object.keys(savedConfig.productMapping || {}).length);
      
      // Test the mapping function
      console.log('\n🧪 Testing product mapping...');
      
      const testCases = [
        { productId: "1822", expected: "pro_bundle_123" },
        { productId: "Pro Bundle", expected: "pro_bundle_123" },
        { productId: "PRO-BUNDLE-001", expected: "pro_bundle_123" },
        { productId: "12345", expected: "basic_course_456" },
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
    
    console.log('\n🎯 Security Excellence shop configuration complete!');
    console.log('Your webhook from securityexcellence.myshopify.com should now work.');
    
  } catch (error) {
    console.error('❌ Error setting up Security Excellence shop configuration:', error);
  }
}

// Run the setup
setupSecurityExcellenceShop();