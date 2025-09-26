const { Shop } = require('./config');

// Pre-configured shop data for testing
const defaultShopConfig = {
  shop: 'securitymasterclasses.myshopify.com',
  isActive: true,
  learnworlds: {
    baseURL: process.env.LEARNWORLDS_API_BASE || 'https://api.learnworlds.com',
    clientId: process.env.LEARNWORLDS_CLIENT_ID,
    authToken: process.env.LEARNWORLDS_AUTH_TOKEN
  },
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
};

async function loadConfiguration() {
  try {
    console.log('🔧 Loading shop configuration...');
    
    // Check if configuration already exists
    const existingConfig = await Shop.findOne({ where: { shop: defaultShopConfig.shop } });
    
    if (existingConfig) {
      console.log('✅ Shop configuration already exists');
      console.log('📋 Configuration:', JSON.stringify(existingConfig, null, 2));
      return existingConfig;
    }
    
    // Create the configuration
    console.log('📝 Creating shop configuration...');
    const result = await Shop.upsert(defaultShopConfig);
    console.log('✅ Shop configuration created successfully!');
    console.log('📋 Configuration:', JSON.stringify(defaultShopConfig, null, 2));
    
    return result;
  } catch (error) {
    console.error('❌ Error loading configuration:', error);
    throw error;
  }
}

module.exports = { loadConfiguration };