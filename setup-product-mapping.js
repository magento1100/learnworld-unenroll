const { Shop } = require('./config');

async function setupProductMapping(shopDomain, productMappings) {
  try {
    console.log(`🔧 Setting up product mappings for ${shopDomain}...\n`);
    
    // Validate inputs
    if (!shopDomain || !productMappings) {
      throw new Error('Shop domain and product mappings are required');
    }
    
    if (typeof productMappings !== 'object' || Object.keys(productMappings).length === 0) {
      throw new Error('Product mappings must be a non-empty object');
    }

    // Get current shop configuration
    let shopConfig = await Shop.findOne({ where: { shop: shopDomain } });
    
    if (!shopConfig) {
      console.log(`   Creating new shop configuration for ${shopDomain}...`);
      shopConfig = {
        shop: shopDomain,
        isActive: true,
        learnworlds: {
          baseURL: process.env.LEARNWORLDS_API_BASE,
          clientId: process.env.LEARNWORLDS_CLIENT_ID,
          authToken: process.env.LEARNWORLDS_AUTH_TOKEN
        },
        productMapping: {}
      };
    }

    // Update shop configuration with product mapping
    shopConfig.productMapping = { ...shopConfig.productMapping, ...productMappings };
    
    await Shop.upsert(shopConfig);
    
    console.log(`   ✅ Product mapping updated for ${shopDomain}`);
    console.log(`   Total mappings: ${Object.keys(shopConfig.productMapping).length}`);
    console.log(`   Mappings:`, JSON.stringify(shopConfig.productMapping, null, 2));
    
    return {
      success: true,
      shop: shopDomain,
      mappingsCount: Object.keys(shopConfig.productMapping).length,
      mappings: shopConfig.productMapping
    };
    
  } catch (error) {
    console.error(`❌ Error setting up product mapping for ${shopDomain}:`, error);
    throw error;
  }
}

// Example usage function
async function setupExampleMappings() {
  try {
    console.log('🚀 Setting up example product mappings...\n');
    
    // Example product mappings - these should be replaced with your actual mappings
    const exampleMappings = {
      // Map Shopify product IDs to LearnWorlds product IDs
      '1822': 'pro_bundle_123',      // Example: Shopify Product ID -> LearnWorlds Course ID
      '12345': 'basic_course_456',   // Example: Shopify Product ID -> LearnWorlds Course ID
      '67890': 'premium_bundle_789', // Example: Shopify Product ID -> LearnWorlds Course ID
      
      // You can also map by SKU or product name
      'PRO-BUNDLE-001': 'pro_bundle_123',
      'BASIC-COURSE-001': 'basic_course_456',
      'PREMIUM-BUNDLE-001': 'premium_bundle_789',
      
      // Or by product title
      'Pro Bundle': 'pro_bundle_123',
      'Basic Course': 'basic_course_456',
      'Premium Bundle': 'premium_bundle_789'
    };
    
    // Setup mappings for your shops
    const shops = [
      'securitymasterclasses.myshopify.com',
      'securityexcellence.myshopify.com'
    ];
    
    const results = [];
    
    for (const shop of shops) {
      try {
        const result = await setupProductMapping(shop, exampleMappings);
        results.push(result);
        console.log(`✅ Successfully configured ${shop}\n`);
      } catch (error) {
        console.error(`❌ Failed to configure ${shop}:`, error.message);
      }
    }
    
    console.log('📊 Configuration Summary:');
    results.forEach(result => {
      if (result.success) {
        console.log(`   ✅ ${result.shop}: ${result.mappingsCount} mappings`);
      }
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ Error in setupExampleMappings:', error);
    throw error;
  }
}

// Export functions for use in other files
module.exports = {
  setupProductMapping,
  setupExampleMappings
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupExampleMappings()
    .then(() => console.log('\n🎉 Product mapping setup completed!'))
    .catch(error => console.error('\n💥 Product mapping setup failed:', error));
}

// Run the setup
setupProductMapping();