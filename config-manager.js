const { Shop } = require('./config');

/**
 * Configuration Manager for Production Environment
 * Reads product mappings from environment variables and configures shops dynamically
 */
class ConfigManager {
  
  /**
   * Parse product mappings from environment variable string
   * Expected format: "shopify_id1:learnworlds_id1,shopify_id2:learnworlds_id2"
   * Or JSON format: '{"shopify_id1":"learnworlds_id1","shopify_id2":"learnworlds_id2"}'
   */
  static parseProductMappings(mappingsString) {
    if (!mappingsString) {
      return {};
    }
    
    try {
      // Try to parse as JSON first
      if (mappingsString.startsWith('{') && mappingsString.endsWith('}')) {
        return JSON.parse(mappingsString);
      }
      
      // Parse as comma-separated key:value pairs
      const mappings = {};
      const pairs = mappingsString.split(',');
      
      for (const pair of pairs) {
        const [shopifyId, learnworldsId] = pair.split(':');
        if (shopifyId && learnworldsId) {
          mappings[shopifyId.trim()] = learnworldsId.trim();
        }
      }
      
      return mappings;
    } catch (error) {
      console.error('❌ Error parsing product mappings:', error);
      return {};
    }
  }
  
  /**
   * Configure a single shop with product mappings from environment
   */
  static async configureShop(shopDomain) {
    try {
      console.log(`🔧 Configuring shop: ${shopDomain}`);
      
      // Build environment variable keys for this shop
      const mappingsKey = `PRODUCT_MAPPINGS_${shopDomain.toUpperCase().replace(/\./g, '_')}`;
      const isActiveKey = `SHOP_ACTIVE_${shopDomain.toUpperCase().replace(/\./g, '_')}`;
      
      // Get product mappings from environment
      const mappingsString = process.env[mappingsKey] || process.env.PRODUCT_MAPPINGS;
      const productMappings = this.parseProductMappings(mappingsString);
      
      if (Object.keys(productMappings).length === 0) {
        console.log(`⚠️  No product mappings found for ${shopDomain}`);
        console.log(`   Looking for: ${mappingsKey} or PRODUCT_MAPPINGS`);
        return null;
      }
      
      // Get shop active status
      const isActive = process.env[isActiveKey] !== 'false'; // Default to true
      
      // Get shop configuration
      let shopConfig = await Shop.findOne({ where: { shop: shopDomain } });
      
      if (!shopConfig) {
        console.log(`   Creating new configuration for ${shopDomain}`);
        shopConfig = {
          shop: shopDomain,
          isActive: isActive,
          learnworlds: {
            baseURL: process.env.LEARNWORLDS_API_BASE,
            clientId: process.env.LEARNWORLDS_CLIENT_ID,
            authToken: process.env.LEARNWORLDS_AUTH_TOKEN
          },
          productMapping: productMappings
        };
      } else {
        console.log(`   Updating existing configuration for ${shopDomain}`);
        shopConfig.isActive = isActive;
        shopConfig.productMapping = { ...shopConfig.productMapping, ...productMappings };
      }
      
      await Shop.upsert(shopConfig);
      
      console.log(`✅ Successfully configured ${shopDomain}`);
      console.log(`   Active: ${isActive}`);
      console.log(`   Mappings: ${Object.keys(productMappings).length}`);
      
      return {
        success: true,
        shop: shopDomain,
        isActive: isActive,
        mappingsCount: Object.keys(productMappings).length,
        mappings: productMappings
      };
      
    } catch (error) {
      console.error(`❌ Error configuring shop ${shopDomain}:`, error);
      throw error;
    }
  }
  
  /**
   * Configure multiple shops from environment
   */
  static async configureShops(shopDomains) {
    try {
      console.log('🚀 Configuring multiple shops from environment...\n');
      
      const results = [];
      
      for (const shopDomain of shopDomains) {
        try {
          const result = await this.configureShop(shopDomain);
          if (result) {
            results.push(result);
          }
        } catch (error) {
          console.error(`❌ Failed to configure ${shopDomain}:`, error.message);
        }
      }
      
      console.log('\n📊 Configuration Summary:');
      results.forEach(result => {
        console.log(`   ✅ ${result.shop}: ${result.mappingsCount} mappings (Active: ${result.isActive})`);
      });
      
      return results;
      
    } catch (error) {
      console.error('❌ Error configuring shops:', error);
      throw error;
    }
  }
  
  /**
   * Auto-configure shops from environment variable
   */
  static async autoConfigure() {
    try {
      console.log('🤖 Auto-configuring shops from environment...\n');
      
      // Get shop domains from environment
      const shopDomainsString = process.env.SHOPIFY_SHOP_DOMAINS;
      
      if (!shopDomainsString) {
        console.log('⚠️  No SHOPIFY_SHOP_DOMAINS found in environment');
        console.log('   Expected format: "shop1.myshopify.com,shop2.myshopify.com"');
        return [];
      }
      
      const shopDomains = shopDomainsString.split(',').map(domain => domain.trim());
      
      if (shopDomains.length === 0) {
        console.log('⚠️  No shop domains found in SHOPIFY_SHOP_DOMAINS');
        return [];
      }
      
      console.log(`   Found ${shopDomains.length} shop domains to configure`);
      
      return await this.configureShops(shopDomains);
      
    } catch (error) {
      console.error('❌ Error in auto-configuration:', error);
      throw error;
    }
  }
  
  /**
   * Get current configuration for a shop
   */
  static async getShopConfiguration(shopDomain) {
    try {
      const shopConfig = await Shop.findOne({ where: { shop: shopDomain } });
      
      if (!shopConfig) {
        console.log(`⚠️  No configuration found for ${shopDomain}`);
        return null;
      }
      
      return {
        shop: shopConfig.shop,
        isActive: shopConfig.isActive,
        mappingsCount: Object.keys(shopConfig.productMapping || {}).length,
        mappings: shopConfig.productMapping || {},
        learnworldsConfigured: !!(shopConfig.learnworlds?.baseURL && shopConfig.learnworlds?.clientId && shopConfig.learnworlds?.authToken)
      };
      
    } catch (error) {
      console.error(`❌ Error getting configuration for ${shopDomain}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all configured shops
   */
  static async getAllConfigurations() {
    try {
      // Use the Shop model to get all shops from the in-memory store
      const { Shop } = require('./config');
      
      // Get all shop domains by checking the in-memory storage
      // Since we don't have a direct way to get all shops, we'll use a different approach
      const shopDomains = [];
      
      // Try to get shops from environment variables first
      const shopDomainsString = process.env.SHOPIFY_SHOP_DOMAINS;
      if (shopDomainsString) {
        shopDomains.push(...shopDomainsString.split(',').map(domain => domain.trim()));
      }
      
      // Also check for any existing shop configurations
      const commonShops = [
        'securitymasterclasses.myshopify.com',
        'securityexcellence.myshopify.com'
      ];
      
      for (const shopDomain of commonShops) {
        const config = await this.getShopConfiguration(shopDomain);
        if (config) {
          shopDomains.push(shopDomain);
        }
      }
      
      // Remove duplicates and get configurations
      const uniqueDomains = [...new Set(shopDomains)];
      const configurations = [];
      
      for (const domain of uniqueDomains) {
        const config = await this.getShopConfiguration(domain);
        if (config) {
          configurations.push(config);
        }
      }
      
      return configurations;
      
    } catch (error) {
      console.error('❌ Error getting all configurations:', error);
      throw error;
    }
  }
}

module.exports = ConfigManager;