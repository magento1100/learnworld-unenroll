require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { shopifyConfig, Shop, WebhookEvent } = require('./config');
const WebhookHandler = require('./webhookHandler');
const LearnWorldsAPI = require('./learnworlds');
const { loadConfiguration } = require('./load-config');
const ConfigManager = require('./config-manager');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for embedded app
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize storage (no-op for in-memory store)
async function initializeStorage() {
  try {
    console.log('In-memory storage initialized');
    
    // Load default shop configuration for testing
    await loadConfiguration();
  } catch (error) {
    console.error('Storage initialization failed:', error);
    process.exit(1);
  }
}

// Shopify OAuth routes
app.get('/auth', async (req, res) => {
  const { shop } = req.query;
  
  if (!shop) {
    return res.status(400).send('Missing shop parameter');
  }

  try {
    // Build OAuth URL manually for Shopify API v7
    const redirectUri = `${process.env.SHOPIFY_APP_URL}/auth/callback`;
    const scopes = process.env.SHOPIFY_SCOPES?.split(',') || ['read_orders', 'write_orders', 'read_customers', 'write_customers'];
    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${scopes.join(',')}&redirect_uri=${redirectUri}&state=123456`;
    
    res.redirect(authUrl);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).send('Authentication failed');
  }
});

app.get('/auth/callback', async (req, res) => {
  try {
    const { shop, code } = req.query;
    
    if (!shop || !code) {
      return res.status(400).send('Missing shop or code parameter');
    }

    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code: code
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const scope = tokenData.scope;
    
    // Store shop data
    await Shop.upsert({
      shop,
      accessToken,
      scope,
      learnworldsClientId: process.env.LEARNWORLDS_CLIENT_ID,
      learnworldsAuthToken: process.env.LEARNWORLDS_AUTH_TOKEN,
      learnworldsBaseUrl: process.env.LEARNWORLDS_API_BASE,
      isActive: true
    });
    
    // Register webhooks
    await registerWebhooks(shop, accessToken);
    
    // Redirect to app
    res.redirect(`/?shop=${shop}&host=${req.query.host}`);
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).send('Authentication callback failed');
  }
});

// Register Shopify webhooks
async function registerWebhooks(shop, accessToken) {
  const webhooks = [
    { topic: 'orders/refunded', path: '/webhooks/orders/refunded' },
    { topic: 'orders/partially_refunded', path: '/webhooks/orders/partially_refunded' },
    { topic: 'orders/cancelled', path: '/webhooks/orders/cancelled' }
  ];
  
  for (const webhook of webhooks) {
    try {
      const response = await fetch(`https://${shop}/admin/api/${process.env.SHOPIFY_API_VERSION || '2024-01'}/webhooks.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: JSON.stringify({
          webhook: {
            topic: webhook.topic,
            address: `${process.env.SHOPIFY_APP_URL}${webhook.path}`,
            format: 'json'
          }
        })
      });

      if (response.ok) {
        console.log(`Registered webhook: ${webhook.topic}`);
      } else {
        console.error(`Failed to register webhook ${webhook.topic}:`, await response.text());
      }
    } catch (error) {
      console.error(`Failed to register webhook ${webhook.topic}:`, error);
    }
  }
}

// Webhook endpoints
app.post('/webhooks/orders/:action', async (req, res) => {
  try {
    const { action } = req.params;
    const shop = req.get('X-Shopify-Shop-Domain');
    const topic = `orders/${action}`;
    const signature = req.get('X-Shopify-Hmac-Sha256');
    
    console.log(`\n📨 Incoming webhook: ${topic} for shop ${shop}`);
    console.log(`   Headers: X-Shopify-Shop-Domain=${shop}, X-Shopify-Hmac-Sha256=${signature ? 'present' : 'missing'}`);
    
    if (!shop || !signature) {
      console.log(`❌ Missing required headers for ${topic} webhook`);
      return res.status(400).json({ 
        error: 'Missing required headers',
        message: 'X-Shopify-Shop-Domain and X-Shopify-Hmac-Sha256 headers are required'
      });
    }

    // Get shop configuration
    let shopConfig = await Shop.findOne({ where: { shop } });
    
    console.log(`   Shop configuration found: ${!!shopConfig}`);
    if (!shopConfig) {
      console.log(`❌ No shop configuration found for ${shop}`);
      return res.status(404).json({ 
        error: 'Shop configuration not found',
        message: 'Please configure your shop settings first'
      });
    }
    
    if (!shopConfig.isActive) {
      console.log(`❌ Shop ${shop} is inactive`);
      return res.status(403).json({ 
        error: 'Shop is inactive',
        message: 'Shop configuration is disabled'
      });
    }

    // Log webhook details
    const bodyString = JSON.stringify(req.body);
    console.log(`   Webhook details:`);
    console.log(`     Topic: ${topic}`);
    console.log(`     Shop: ${shop}`);
    console.log(`     Body length: ${bodyString.length} characters`);
    console.log(`     Signature present: ${!!signature}`);
    console.log(`     API Secret present: ${!!process.env.SHOPIFY_API_SECRET}`);
    
    // Process webhook
    const result = await WebhookHandler.processWebhook(
      topic,
      shop,
      bodyString,
      signature,
      process.env.SHOPIFY_API_SECRET
    );

    console.log(`✅ Webhook processed successfully: ${topic} for shop ${shop}`);
    console.log(`   Result: processed=${result.processed}, success=${result.result?.success || false}`);
    
    res.status(200).json({ 
      success: true,
      processed: result.processed,
      result: result.result || null,
      reason: result.reason || null
    });
    
  } catch (error) {
    console.error(`❌ Webhook processing error for ${topic}:`, error);
    res.status(500).json({ 
      error: error.message,
      message: 'Internal server error processing webhook'
    });
  }
});

// API routes
app.get('/api/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    const shopConfig = await Shop.findOne({ where: { shop } });
    if (!shopConfig) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const lwApi = new LearnWorldsAPI({
      baseURL: shopConfig.learnworldsBaseUrl,
      clientId: shopConfig.learnworldsClientId,
      authToken: shopConfig.learnworldsAuthToken
    });

    const user = await lwApi.getUser(email);
    const courses = await lwApi.getUserCourses(email);
    const products = await lwApi.getUserProducts(email);

    res.json({
      user,
      courses,
      products
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/unenroll', async (req, res) => {
  try {
    const { email, productId, productType, shop } = req.body;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    const shopConfig = await Shop.findOne({ where: { shop } });
    if (!shopConfig) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const lwApi = new LearnWorldsAPI({
      baseURL: shopConfig.learnworldsBaseUrl,
      clientId: shopConfig.learnworldsClientId,
      authToken: shopConfig.learnworldsAuthToken
    });

    const result = await lwApi.unenrollUser(email, productId, productType);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Unenroll error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/enroll', async (req, res) => {
  try {
    const { email, productId, productType, price, shop } = req.body;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    const shopConfig = await Shop.findOne({ where: { shop } });
    if (!shopConfig) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const lwApi = new LearnWorldsAPI({
      baseURL: shopConfig.learnworldsBaseUrl,
      clientId: shopConfig.learnworldsClientId,
      authToken: shopConfig.learnworldsAuthToken
    });

    const result = await lwApi.enrollUser(email, productId, productType, price || 0);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin dashboard
app.get('/admin', async (req, res) => {
  const { shop } = req.query;
  
  if (!shop) {
    return res.redirect('/auth');
  }

  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Webhook logs
app.get('/api/webhooks/logs', async (req, res) => {
  try {
    const { shop } = req.query;
    const limit = parseInt(req.query.limit) || 50;
    
    const logs = await WebhookEvent.findAll({
      where: { shop },
      order: [['createdAt', 'DESC']],
      limit
    });

    res.json(logs);
  } catch (error) {
    console.error('Webhook logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Initialize storage and start server
async function startServer() {
  try {
    console.log('🚀 Initializing storage...');
    await initializeStorage();
    console.log('✅ Storage initialized');

    // Run production setup if in production mode
    if (process.env.NODE_ENV === 'production') {
      console.log('🔧 Running production configuration setup...');
      try {
        await ConfigManager.autoConfigure();
        console.log('✅ Production configuration completed');
      } catch (setupError) {
        console.error('⚠️  Production setup failed:', setupError.message);
        // Continue server startup even if setup fails
      }
    }

    app.listen(PORT, () => {
      console.log(`🎯 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 Webhook verification: ${process.env.SKIP_WEBHOOK_VERIFICATION === 'true' ? 'DISABLED' : 'ENABLED'}`);
      
      // Log configured shops
      ConfigManager.getAllConfigurations()
        .then(configs => {
          if (configs.length > 0) {
            console.log(`🏪 Configured shops: ${configs.length}`);
            configs.forEach(config => {
              console.log(`   - ${config.shop}: ${config.mappingsCount} mappings (${config.isActive ? 'active' : 'inactive'})`);
            });
          }
        })
        .catch(error => {
          console.log('⚠️  Could not retrieve shop configurations:', error.message);
        });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
