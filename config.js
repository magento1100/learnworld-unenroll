const shopify = require('@shopify/shopify-api');
require('dotenv').config();

// Simple Shopify configuration object
const shopifyConfig = {
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecret: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_SCOPES?.split(',') || ['read_orders', 'write_orders', 'read_customers', 'write_customers'],
  appUrl: process.env.SHOPIFY_APP_URL,
  apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01'
};

// LearnWorlds API Configuration
const learnworldsConfig = {
  baseURL: process.env.LEARNWORLDS_API_BASE,
  clientId: process.env.LEARNWORLDS_CLIENT_ID,
  authToken: process.env.LEARNWORLDS_AUTH_TOKEN
};

// Load configuration function
async function loadConfiguration() {
  const defaultShopConfig = {
    shop: 'securitymasterclasses.myshopify.com',
    isActive: true,
    learnworlds: {
      baseURL: process.env.LEARNWORLDS_API_BASE || 'https://securitymasterclasses.securityexcellence.net/admin/api/v2',
      clientId: process.env.LEARNWORLDS_CLIENT_ID || '64facb2d6072346ff30ed226',
      authToken: process.env.LEARNWORLDS_AUTH_TOKEN || 'O4EwphUJmAjwegMMAxMYGZBpeewtpxF2PXrAv8yX'
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

  // Check if configuration already exists
  const existingConfig = await Shop.findOne({ where: { shop: defaultShopConfig.shop } });
  
  if (existingConfig) {
    return existingConfig;
  }
  
  // Create the configuration
  await Shop.upsert(defaultShopConfig);
  return defaultShopConfig;
}

// Simple in-memory storage for serverless environment
class InMemoryStore {
  constructor() {
    this.shops = new Map();
    this.webhookEvents = new Map();
  }
  
  // Shop methods
  async upsertShop(shopData) {
    // Flatten the learnworlds configuration for compatibility with server.js
    const flattenedData = {
      ...shopData,
      learnworldsBaseUrl: shopData.learnworlds?.baseURL || shopData.learnworldsBaseUrl,
      learnworldsClientId: shopData.learnworlds?.clientId || shopData.learnworldsClientId,
      learnworldsAuthToken: shopData.learnworlds?.authToken || shopData.learnworldsAuthToken
    };
    
    this.shops.set(shopData.shop, flattenedData);
    return flattenedData;
  }
  
  async findShop(shop) {
    return this.shops.get(shop) || null;
  }
  
  // Webhook event methods
  async createWebhookEvent(eventData) {
    const id = Date.now().toString();
    const event = { ...eventData, webhookId: id, createdAt: new Date() };
    this.webhookEvents.set(id, event);
    return event;
  }
  
  async findWebhookEvents(query = {}) {
    const events = Array.from(this.webhookEvents.values());
    if (query.shop) {
      return events.filter(e => e.shop === query.shop);
    }
    return events;
  }
}

const store = new InMemoryStore();

// Mock Sequelize-like interface for compatibility
const sequelize = {
  authenticate: async () => true,
  sync: async () => true,
  define: () => ({
    upsert: (data) => store.upsertShop(data),
    findOne: ({ where }) => store.findShop(where.shop),
    findAll: ({ where, order, limit } = {}) => store.findWebhookEvents(where)
  })
};

// Mock models
const Shop = {
  upsert: (data) => store.upsertShop(data),
  findOne: ({ where }) => store.findShop(where.shop)
};

const WebhookEvent = {
  findOne: ({ where }) => {
    const events = Array.from(store.webhookEvents.values());
    const event = events.find(e => e.webhookId === where.webhookId);
    return Promise.resolve(event || null);
  },
  findAll: ({ where, order, limit } = {}) => {
    const events = store.findWebhookEvents(where);
    return Promise.resolve(events.slice(0, limit || events.length));
  },
  create: (data) => {
    return store.createWebhookEvent(data);
  },
  update: (data) => {
    const event = store.webhookEvents.get(data.webhookId);
    if (event) {
      Object.assign(event, data);
      store.webhookEvents.set(data.webhookId, event);
    }
    return Promise.resolve(event);
  }
};

module.exports = {
  shopifyConfig,
  learnworldsConfig,
  sequelize,
  Shop,
  WebhookEvent,
  loadConfiguration,
};