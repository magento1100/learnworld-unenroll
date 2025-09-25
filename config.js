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

// Database configuration (using Sequelize)
const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL) {
  // Production database (PostgreSQL, MySQL, etc.)
  sequelize = new Sequelize(process.env.DATABASE_URL);
} else if (process.env.NODE_ENV === 'production') {
  // Production fallback - use in-memory SQLite for serverless
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  });
} else {
  // Development - use file-based SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite',
    logging: false
  });
}

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