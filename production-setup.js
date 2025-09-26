#!/usr/bin/env node

/**
 * Production Setup Script
 * Configures product mappings from environment variables for Vercel deployment
 */

const ConfigManager = require('./config-manager');

async function productionSetup() {
  console.log('🚀 Production Setup Script Starting...\n');
  
  try {
    // Check required environment variables
    const requiredEnvVars = [
      'SHOPIFY_SHOP_DOMAINS',
      'LEARNWORLDS_API_BASE',
      'LEARNWORLDS_CLIENT_ID',
      'LEARNWORLDS_AUTH_TOKEN'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      console.error('\nPlease set these environment variables in your Vercel dashboard.');
      process.exit(1);
    }
    
    console.log('✅ All required environment variables are set');
    
    // Auto-configure shops from environment
    const results = await ConfigManager.autoConfigure();
    
    if (results.length === 0) {
      console.log('\n⚠️  No shops were configured. Please check your environment variables.');
      console.log('\nEnvironment Variable Examples:');
      console.log('   SHOPIFY_SHOP_DOMAINS="securitymasterclasses.myshopify.com,securityexcellence.myshopify.com"');
      console.log('   PRODUCT_MAPPINGS_SECURITYMASTERCLASSES_MYSHOPIFY_COM=\'{"1822":"pro_bundle_123","12345":"basic_course_456"}\'');
      console.log('   PRODUCT_MAPPINGS_SECURITYEXCELLENCE_MYSHOPIFY_COM=\'{"1822":"pro_bundle_123","12345":"basic_course_456"}\'');
      console.log('   PRODUCT_MAPPINGS=\'{"1822":"pro_bundle_123","12345":"basic_course_456"}\' (fallback for all shops)');
      process.exit(1);
    }
    
    console.log('\n🎉 Production setup completed successfully!');
    console.log('\n📊 Summary:');
    results.forEach(result => {
      console.log(`   ✅ ${result.shop}:`);
      console.log(`      - Active: ${result.isActive}`);
      console.log(`      - Mappings: ${result.mappingsCount}`);
      console.log(`      - Mappings:`, JSON.stringify(result.mappings, null, 6));
    });
    
    // Show current configuration
    console.log('\n🔍 Current Configuration Status:');
    const allConfigs = await ConfigManager.getAllConfigurations();
    
    allConfigs.forEach(config => {
      console.log(`   ${config.shop}:`);
      console.log(`      - Active: ${config.isActive}`);
      console.log(`      - LearnWorlds Configured: ${config.learnworldsConfigured}`);
      console.log(`      - Product Mappings: ${config.mappingsCount}`);
    });
    
  } catch (error) {
    console.error('❌ Production setup failed:', error);
    process.exit(1);
  }
}

// Check if this script should run
if (process.env.NODE_ENV === 'production' || process.env.RUN_PRODUCTION_SETUP) {
  productionSetup()
    .then(() => {
      console.log('\n✅ Production setup script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Production setup script failed:', error);
      process.exit(1);
    });
} else {
  console.log('ℹ️  Production setup script skipped (NODE_ENV is not production)');
  console.log('   Set NODE_ENV=production or RUN_PRODUCTION_SETUP=true to run this script.');
}