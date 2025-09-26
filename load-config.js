const { Shop } = require('./config');

// Pre-configured shop data for testing
const defaultShopConfigs = [
  {
    shop: 'securitymasterclasses.myshopify.com',
    isActive: true,
    learnworldsBaseUrl: 'https://securitymasterclasses.securityexcellence.net/admin/api/v2',
    learnworldsClientId: '64facb2d6072346ff30ed226',
    learnworldsAuthToken: process.env.LEARNWORLDS_AUTH_TOKEN,
    productMapping: {
      // Product ID mappings
      '1822': 'pro_bundle_123',
      '12345': 'basic_course_456',
      '67890': 'premium_bundle_789',
      
      // SKU mappings
      'PRO-BUNDLE-001': 'pro_bundle_123',
      'BASIC-COURSE-001': 'basic_course_456',
      'PREMIUM-BUNDLE-001': 'premium_bundle_789',
      
      // Product name mappings
      'Pro Bundle': 'pro_bundle_123',
      'Basic Course': 'basic_course_456',
      'Premium Bundle': 'premium_bundle_789'
    }
  },
  {
    shop: 'securityexcellence.myshopify.com',
    isActive: true,
    learnworldsBaseUrl: 'https://securitymasterclasses.securityexcellence.net/admin/api/v2',
    learnworldsClientId: '64facb2d6072346ff30ed226',
    learnworldsAuthToken: process.env.LEARNWORLDS_AUTH_TOKEN,
    productMapping: {
      // Product ID mappings
      '1822': 'pro_bundle_123',
      '12345': 'basic_course_456',
      '67890': 'premium_bundle_789',
      
      // SKU mappings
      'PRO-BUNDLE-001': 'pro_bundle_123',
      'BASIC-COURSE-001': 'basic_course_456',
      'PREMIUM-BUNDLE-001': 'premium_bundle_789',
      
      // Product name mappings
      'Pro Bundle': 'pro_bundle_123',
      'Basic Course': 'basic_course_456',
      'Premium Bundle': 'premium_bundle_789'
    }
  }
];

async function loadConfiguration() {
  try {
    console.log('🔧 Loading shop configurations...');
    
    for (const shopConfig of defaultShopConfigs) {
      // Check if configuration already exists
      const existingConfig = await Shop.findOne({ where: { shop: shopConfig.shop } });
      
      if (existingConfig) {
        console.log(`✅ Shop configuration already exists for ${shopConfig.shop}`);
      } else {
        // Create the configuration
        console.log(`📝 Creating shop configuration for ${shopConfig.shop}...`);
        await Shop.upsert(shopConfig);
        console.log(`✅ Shop configuration created successfully for ${shopConfig.shop}!`);
      }
    }
    
    console.log('📋 All shop configurations loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Error loading configuration:', error);
    throw error;
  }
}

module.exports = { loadConfiguration };