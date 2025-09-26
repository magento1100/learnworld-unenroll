const { Shop } = require('./config');

async function setupProductMapping() {
  try {
    // Get current shop configuration
    let shopConfig = await Shop.findOne({ where: { shop: 'securitymasterclasses.myshopify.com' } });
    
    if (!shopConfig) {
      console.log('Creating new shop configuration...');
      shopConfig = {
        shop: 'securitymasterclasses.myshopify.com',
        isActive: true,
        learnworlds: {
          baseURL: process.env.LEARNWORLDS_API_BASE || 'https://api.learnworlds.com',
          clientId: process.env.LEARNWORLDS_CLIENT_ID,
          authToken: process.env.LEARNWORLDS_AUTH_TOKEN
        },
        productMapping: {}
      };
    }

    // Add product mapping for the "pro" bundle
    // Based on your order details:
    // - Order ID: 1822
    // - Customer: vrushika.storetransform@gmail.com
    // - Product: "pro" bundle
    
    const productMapping = {
      // Map Shopify product ID to LearnWorlds product ID
      // You need to replace these with your actual IDs
      "1822": "pro_bundle_id", // Order ID mapping (if needed)
      "pro": "pro_bundle_id",  // Product name mapping
      "12345": "pro_bundle_id" // Example Shopify product ID mapping
    };

    // Update shop configuration with product mapping
    shopConfig.productMapping = { ...shopConfig.productMapping, ...productMapping };
    
    await Shop.upsert(shopConfig);
    
    console.log('✅ Product mapping configured successfully!');
    console.log('Current product mappings:', JSON.stringify(shopConfig.productMapping, null, 2));
    
    // Test the mapping
    console.log('\n🔍 Testing product mapping...');
    const testProductId = "pro";
    const mappedId = shopConfig.productMapping[testProductId];
    
    if (mappedId) {
      console.log(`✅ Product "${testProductId}" maps to LearnWorlds ID: ${mappedId}`);
    } else {
      console.log(`❌ No mapping found for product "${testProductId}"`);
    }
    
  } catch (error) {
    console.error('❌ Error setting up product mapping:', error);
  }
}

// Run the setup
setupProductMapping();