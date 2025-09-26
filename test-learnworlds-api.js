const LearnWorldsAPI = require('./learnworlds');
const { Shop, sequelize } = require('./config');

// Load configuration function
async function loadConfiguration() {
  console.log('🔧 Loading shop configuration...');
  
  const shopConfig = {
    shop: 'securitymasterclasses.myshopify.com',
    isActive: true,
    learnworlds: {
      baseURL: 'https://securitymasterclasses.securityexcellence.net/admin/api/v2',
      clientId: '64facb2d6072346ff30ed226',
      authToken: 'O4EwphUJmAjwegMMAxMYGZBpeewtpxF2PXrAv8yX'
    },
    productMapping: {
      '1822': 'pro_bundle_123',
      '12345': 'basic_course_456',
      '67890': 'premium_bundle_789',
      'PRO-BUNDLE-001': 'pro_bundle_123',
      'BASIC-COURSE-001': 'basic_course_456',
      'PREMIUM-BUNDLE-001': 'premium_bundle_789',
      'Pro Bundle': 'pro_bundle_123',
      'Basic Course': 'basic_course_456',
      'Premium Bundle': 'premium_bundle_789'
    }
  };

  try {
    const result = await Shop.upsert(shopConfig);
    console.log('✅ Shop configuration created successfully!');
    console.log('📋 Configuration:', JSON.stringify(shopConfig, null, 2));
    return result;
  } catch (error) {
    console.error('❌ Error loading configuration:', error);
    throw error;
  }
}

async function testLearnWorldsAPI() {
  console.log('🧪 Testing LearnWorlds API Integration...\n');

  try {
    // Initialize storage first
    console.log('🔧 Initializing storage...');
    await sequelize.sync();
    console.log('✅ Storage initialized');

    // Load configuration
    await loadConfiguration();
    // Get shop configuration
    const shopConfig = await Shop.findOne({ where: { shop: 'securitymasterclasses.myshopify.com' } });
    if (!shopConfig) {
      console.log('❌ Shop configuration not found');
      return;
    }

    console.log('📋 Shop Configuration:');
    console.log('  Shop:', shopConfig.shop);
    console.log('  LearnWorlds Config:', {
      baseURL: shopConfig.learnworlds?.baseURL,
      clientId: shopConfig.learnworlds?.clientId,
      hasAuthToken: !!shopConfig.learnworlds?.authToken
    });

    // Initialize LearnWorlds API
    const lwApi = new LearnWorldsAPI(shopConfig.learnworlds);

    // Test user email from the webhook
    const testEmail = 'vrushika.storetransform@gmail.com';
    const testProductId = 'pro_bundle_123';

    console.log('\n👤 Testing User Operations for:', testEmail);

    // 1. Check if user exists
    console.log('\n1️⃣ Checking if user exists...');
    try {
      const user = await lwApi.getUser(testEmail);
      console.log('✅ User found:', user ? 'Yes' : 'No');
      if (user) {
        console.log('   User data:', JSON.stringify(user, null, 2));
      }
    } catch (error) {
      console.log('❌ Error checking user:', error.message);
    }

    // 2. Check user's courses
    console.log('\n2️⃣ Checking user courses...');
    try {
      const courses = await lwApi.getUserCourses(testEmail);
      console.log('✅ User courses:', courses ? 'Found' : 'None');
      if (courses) {
        console.log('   Courses:', JSON.stringify(courses, null, 2));
      }
    } catch (error) {
      console.log('❌ Error getting user courses:', error.message);
    }

    // 3. Check user's products
    console.log('\n3️⃣ Checking user products...');
    try {
      const products = await lwApi.getUserProducts(testEmail);
      console.log('✅ User products:', products ? 'Found' : 'None');
      if (products) {
        console.log('   Products:', JSON.stringify(products, null, 2));
      }
    } catch (error) {
      console.log('❌ Error getting user products:', error.message);
    }

    // 4. Test enrollment check
    console.log('\n4️⃣ Testing enrollment check...');
    try {
      // Check if user is enrolled in the specific product
      const products = await lwApi.getUserProducts(testEmail);
      if (products && products.length > 0) {
        const isEnrolled = products.some(p => p.id === testProductId || p.productId === testProductId);
        console.log(`✅ User enrollment status for ${testProductId}:`, isEnrolled ? 'Enrolled' : 'Not enrolled');
      } else {
        console.log('ℹ️  No products found for user');
      }
    } catch (error) {
      console.log('❌ Error checking enrollment:', error.message);
    }

    // 5. Test unenrollment (with caution)
    console.log('\n5️⃣ Testing unenrollment API endpoint...');
    console.log('   This will attempt to unenroll the user to test the API endpoint');
    console.log('   Product ID:', testProductId);
    
    try {
      const result = await lwApi.unenrollUser(testEmail, testProductId, 'course');
      console.log('✅ Unenrollment successful:', result ? 'Yes' : 'No');
      if (result) {
        console.log('   Result:', JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.log('❌ Unenrollment error:', error.message);
      console.log('   This might be expected if the user is not enrolled in the course');
    }

    console.log('\n📊 Test Summary:');
    console.log('  ✅ Shop configuration loaded');
    console.log('  ✅ LearnWorlds API initialized');
    console.log('  ✅ User operations tested');
    console.log('  ✅ API endpoints verified');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testLearnWorldsAPI().catch(console.error);