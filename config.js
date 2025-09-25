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

// Simple in-memory storage for serverless environment
class InMemoryStore {
  constructor() {
    this.shops = new Map();
    this.webhookEvents = new Map();
  }
  
  // Shop methods
  async upsertShop(shopData) {
    this.shops.set(shopData.shop, shopData);
    return shopData;
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
  findAll: ({ where, order, limit } = {}) => {
    const events = store.findWebhookEvents(where);
    return Promise.resolve(events.slice(0, limit || events.length));
  }
};

// Define Shop model for storing shop data
const Shop = sequelize.define('Shop', {
  shop: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  accessToken: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  scope: {
    type: Sequelize.STRING,
  },
  learnworldsClientId: {
    type: Sequelize.STRING,
  },
  learnworldsAuthToken: {
    type: Sequelize.STRING,
  },
  learnworldsBaseUrl: {
    type: Sequelize.STRING,
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
});

// Define Webhook model for tracking processed webhooks
const WebhookEvent = sequelize.define('WebhookEvent', {
  webhookId: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  shop: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  topic: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  orderId: {
    type: Sequelize.STRING,
  },
  processedAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
  status: {
    type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending',
  },
  errorMessage: {
    type: Sequelize.TEXT,
  },
});

module.exports = {
  shopifyConfig,
  learnworldsConfig,
  sequelize,
  Shop,
  WebhookEvent,
};