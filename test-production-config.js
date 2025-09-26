#!/usr/bin/env node

/**
 * Production Configuration Test
 * Tests the new environment-based configuration system
 */

const ConfigManager = require('./config-manager');
const { Shop } = require('./config');

async function testProductionConfig() {
  console.log('🧪 Testing Production Configuration System...\n');
  
  try {
    // Test 1: Set up environment variables
    console.log('1️⃣ Setting up test environment variables...');
    
    // Simulate production environment
    process.env.NODE_ENV = 'production';
    process.env.SHOPIFY_SHOP_DOMAINS = 'securitymasterclasses.myshopify.com,securityexcellence.myshopify.com';
    process.env.PRODUCT_MAPPINGS = '{"1822":"pro_bundle_123","12345":"basic_course_456","PREMIUM-BUNDLE-001":"premium_bundle_789"}';
    process.env.PRODUCT_MAPPINGS_SECURITYMASTERCLASSES_MYSHOPIFY_COM = '{"1822":"pro_bundle_123","CUSTOM-PRODUCT":"custom_course_999"}';
    
    console.log('✅ Environment variables set');
    
    // Test 2: Parse product mappings
    console.log('\n2️⃣ Testing product mapping parser...');
    const globalMappings = ConfigManager.parseProductMappings(process.env.PRODUCT_MAPPINGS);
    const shopSpecificMappings = ConfigManager.parseProductMappings(
      process.env.PRODUCT_MAPPINGS_SECURITYMASTERCLASSES_MYSHOPIFY_COM
    );
    
    console.log('Global mappings:', JSON.stringify(globalMappings, null, 2));
    console.log('Shop-specific mappings:', JSON.stringify(shopSpecificMappings, null, 2));
    
    // Test 3: Auto-configure shops
    console.log('\n3️⃣ Testing auto-configuration...');
    const results = await ConfigManager.autoConfigure();
    
    console.log('Auto-configuration results:', results);
    
    // Test 4: Verify configurations
    console.log('\n4️⃣ Verifying configurations...');
    const allConfigs = await ConfigManager.getAllConfigurations();
    
    console.log('All configurations:');
    allConfigs.forEach(config => {
      console.log(`   Shop: ${config.shop}`);
      console.log(`   Active: ${config.isActive}`);
      console.log(`   Mappings: ${config.mappingsCount}`);
      console.log(`   LearnWorlds Configured: ${config.learnworldsConfigured}`);
      console.log('');
    });
    
    // Test 5: Test product mapping resolution
    console.log('5️⃣ Testing product mapping resolution...');
    const testShop = 'securitymasterclasses.myshopify.com';
    const testProductId = '1822';
    
    const shopConfig = await ConfigManager.getShopConfiguration(testShop);
    const mappedCourse = shopConfig?.mappings[testProductId];
    
    if (mappedCourse) {
      console.log(`✅ Product "${testProductId}" maps to LearnWorlds course: ${mappedCourse}`);
    } else {
      console.log(`❌ No mapping found for product "${testProductId}"`);
    }
    
    // Test 6: Test with different mapping types
    console.log('\n6️⃣ Testing different mapping types...');
    const mappingTests = [
      { shop: 'securitymasterclasses.myshopify.com', product: '1822' },
      { shop: 'securitymasterclasses.myshopify.com', product: 'CUSTOM-PRODUCT' },
      { shop: 'securityexcellence.myshopify.com', product: '12345' },
      { shop: 'securityexcellence.myshopify.com', product: 'PREMIUM-BUNDLE-001' }
    ];
    
    for (const test of mappingTests) {
      const config = await ConfigManager.getShopConfiguration(test.shop);
      const course = config?.mappings[test.product];
      console.log(`${test.shop} -> ${test.product}: ${course || 'NOT FOUND'}`);
    }
    
    console.log('\n🎉 Production configuration test completed successfully!');
    
    // Show final summary
    console.log('\n📊 Final Configuration Summary:');
    const finalConfigs = await ConfigManager.getAllConfigurations();
    
    finalConfigs.forEach(config => {
      console.log(`   ${config.shop}:`);
      console.log(`      - Active: ${config.isActive}`);
      console.log(`      - LearnWorlds Configured: ${config.learnworldsConfigured}`);
      console.log(`      - Total Mappings: ${config.mappingsCount}`);
      console.log(`      - Mappings:`, JSON.stringify(config.mappings, null, 6));
    });
    
  } catch (error) {
    console.error('❌ Production configuration test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testProductionConfig()
    .then(() => {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testProductionConfig };