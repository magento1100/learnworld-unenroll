const { Shop } = require('./config');

async function checkCurrentMappings() {
  try {
    console.log('🔍 Checking current product mappings...\n');
    
    // Check both shop configurations
    const shops = [
      'securitymasterclasses.myshopify.com',
      'securityexcellence.myshopify.com'
    ];

    for (const shopName of shops) {
      console.log(`📋 Shop: ${shopName}`);
      const shopConfig = await Shop.findOne({ where: { shop: shopName } });
      
      if (shopConfig) {
        console.log(`   Status: ${shopConfig.isActive ? 'Active' : 'Inactive'}`);
        console.log(`   Product Mappings:`, JSON.stringify(shopConfig.productMapping || {}, null, 2));
        console.log('');
      } else {
        console.log(`   ❌ Shop configuration not found\n`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking mappings:', error);
  }
}

checkCurrentMappings();