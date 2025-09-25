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
const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL)
  : new Sequelize({
      dialect: 'sqlite',
      storage: 'database.sqlite',
      logging: false
    }); // Use SQLite file for development

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