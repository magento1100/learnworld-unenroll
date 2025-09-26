const { Shop } = require('./config');

async function fixProductMapping() {
  try {
    console.log('🔧 Fixing product mapping for order 1822...\n');
    
    // Get current shop configuration
    let shopConfig = await Shop.findOne({ where: { shop: 'securitymasterclasses.myshopify.com' } });
    
    if (!shopConfig) {
      console.log('❌ Shop configuration not found!');
      return;
    }
    
    console.log('📋 Current shop config:', JSON.stringify(shopConfig, null, 2));
    
    // Add product mapping for order 1822
    const updatedConfig = {
      ...shopConfig,
      productMapping: {
        // Map the specific product ID from order 1822 to LearnWorlds product
        "1822": "pro_bundle_123",  // Shopify product ID → LearnWorlds product ID
        "pro_bundle_123": "pro_bundle_123", // Also map by name
        "Pro Bundle": "pro_bundle_123" // Map by product title
      }
    };
    
    console.log('\n📝 Updating shop configuration with product mapping...');
    
    await Shop.upsert(updatedConfig);
    
    console.log('✅ Product mapping updated successfully!');
    console.log('\n🔄 Updated product mappings:', JSON.stringify(updatedConfig.productMapping, null, 2));
    
    // Test the mapping
    console.log('\n🧪 Testing product mapping...');
    
    const testMappings = [
      { key: "1822", expected: "pro_bundle_123" },
      { key: "pro_bundle_123", expected: "pro_bundle_123" },
      { key: "Pro Bundle", expected: "pro_bundle_123" }
    ];
    
    testMappings.forEach(({ key, expected }) => {
      const result = updatedConfig.productMapping[key];
      if (result === expected) {
        console.log(`✅ Mapping for "${key}" → "${result}" (correct)`);
      } else {
        console.log(`❌ Mapping for "${key}" → "${result}" (expected: ${expected})`);
      }
    });
    
    console.log('\n🎯 Next step: Test the webhook again with the updated mapping!');
    console.log('   Run: node test-order-1822.js');
    
  } catch (error) {
    console.error('❌ Error fixing product mapping:', error);
  }
}

// Run the fix
fixProductMapping();