# Shopify-LearnWorlds Integration

A production-ready Shopify app that automatically unenrolls customers from LearnWorlds courses when they receive refunds on Shopify. Designed for Vercel deployment with GitHub integration.

## 🚀 Production Deployment (Vercel)

### Quick Start

1. **Deploy to Vercel**
   ```bash
   # Push to GitHub first
   git add .
   git commit -m "Production deployment ready"
   git push origin main
   
   # Then connect to Vercel dashboard
   ```

2. **Configure Environment Variables** in Vercel dashboard:
   ```bash
   # Required
   SHOPIFY_API_KEY=your_shopify_api_key
   SHOPIFY_API_SECRET=your_shopify_api_secret
   SHOPIFY_APP_URL=https://your-app.vercel.app
   SHOPIFY_SHOP_DOMAINS=securitymasterclasses.myshopify.com,securityexcellence.myshopify.com
   
   LEARNWORLDS_API_BASE=https://your-school.learnworlds.com/admin/api/v2
   LEARNWORLDS_CLIENT_ID=your_client_id
   LEARNWORLDS_AUTH_TOKEN=your_auth_token
   
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=production
   
   # Product Mappings (JSON format)
   PRODUCT_MAPPINGS={"1822":"pro_bundle_123","12345":"basic_course_456"}
   ```

3. **Configure Shopify Webhooks** in your Shopify admin:
   - `https://your-app.vercel.app/webhook/orders/refunded`
   - `https://your-app.vercel.app/webhook/orders/partially_refunded`
   - `https://your-app.vercel.app/webhook/orders/cancelled`

## 📋 Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `SHOPIFY_API_KEY` | Shopify API key | ✅ | `abc123` |
| `SHOPIFY_API_SECRET` | Shopify API secret | ✅ | `def456` |
| `SHOPIFY_APP_URL` | Your app URL | ✅ | `https://app.vercel.app` |
| `SHOPIFY_SHOP_DOMAINS` | Comma-separated shop domains | ✅ | `shop1.myshopify.com,shop2.myshopify.com` |
| `LEARNWORLDS_API_BASE` | LearnWorlds API base URL | ✅ | `https://school.learnworlds.com/admin/api/v2` |
| `LEARNWORLDS_CLIENT_ID` | LearnWorlds client ID | ✅ | `xyz789` |
| `LEARNWORLDS_AUTH_TOKEN` | LearnWorlds auth token | ✅ | `token123` |
| `PRODUCT_MAPPINGS` | Global product mappings (JSON) | ✅ | `{"123":"course_123"}` |
| `SKIP_WEBHOOK_VERIFICATION` | Skip webhook verification | ❌ | `false` (recommended) |
| `JWT_SECRET` | JWT secret key | ✅ | `secret-key` |
| `NODE_ENV` | Environment | ✅ | `production` |

## 🎯 Features

- **🔄 Automatic Unenrollment**: Processes Shopify refunds and cancellations
- **🔒 Secure Webhooks**: HMAC signature verification (production-ready)
- **📊 Comprehensive Logging**: Detailed webhook processing logs
- **🏪 Multi-Shop Support**: Handle multiple Shopify stores
- **⚙️ Environment-Based Configuration**: No static data, all from env vars
- **🚀 Production Ready**: Vercel-optimized with proper error handling

## 📊 Product Mapping Configuration

### JSON Format (Recommended)
```bash
PRODUCT_MAPPINGS={"shopify_product_id":"learnworlds_course_id"}
```

### Mapping Types Supported
- **Product ID**: `"1822":"pro_bundle_123"`
- **SKU**: `"PRO-BUNDLE-001":"pro_bundle_123"`
- **Product Title**: `"Pro Bundle":"pro_bundle_123"`

### Shop-Specific Mappings
```bash
PRODUCT_MAPPINGS_SECURITYMASTERCLASSES_MYSHOPIFY_COM={"1822":"pro_bundle_123"}
PRODUCT_MAPPINGS_SECURITYEXCELLENCE_MYSHOPIFY_COM={"1822":"pro_bundle_123"}
```

## Installation

### 1. Shopify App Setup

1. Create a new private app in your Shopify store admin
2. Enable the following permissions:
   - `read_orders`
   - `write_orders`
   - `read_customers`
   - `write_customers`
3. Note down your API key and secret

### 2. LearnWorlds Setup

1. Get your LearnWorlds API credentials:
   - Client ID
   - Authorization Token
   - API Base URL (your LearnWorlds domain)

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Shopify Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_APP_URL=https://your-app.vercel.app
SHOPIFY_SCOPES=read_orders,write_orders,read_customers,write_customers

# LearnWorlds Configuration
LEARNWORLDS_API_BASE=https://your-domain.learnworlds.com/admin/api/v2
LEARNWORLDS_CLIENT_ID=your_client_id
LEARNWORLDS_AUTH_TOKEN=your_auth_token

# Database (for production)
DATABASE_URL=mysql://username:password@host:port/database

# Security
JWT_SECRET=your_jwt_secret_key
```

### 4. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. Vercel Deployment

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

## Usage

### Admin Dashboard

Access the admin dashboard at: `https://your-app.vercel.app/admin?shop=your-shop.myshopify.com`

Features:
- **Dashboard**: Overview of integration statistics
- **User Management**: Search users and manage their enrollments
- **Webhook Logs**: View all webhook events and their status
- **Configuration**: Check integration status and settings

### Automatic Unenrollment

The app automatically processes the following Shopify webhooks:

- `orders/refunded` - Full order refund
- `orders/partially_refunded` - Partial refund
- `orders/cancelled` - Order cancellation

### Product Mapping

To map Shopify products to LearnWorlds courses, you can:

1. **Product Tags**: Add tags to your Shopify products in the format `learnworlds:course_id`
2. **Metafields**: Add a metafield with key `learnworlds_product_id` to your products
3. **Custom Logic**: Implement your own mapping in the `mapShopifyToLearnWorlds` function

## API Endpoints

### User Management
- `GET /api/user/:email?shop=shop` - Get user data
- `POST /api/enroll` - Enroll user in course
- `POST /api/unenroll` - Unenroll user from course

### Webhook Logs
- `GET /api/webhooks/logs?shop=shop&limit=50` - Get webhook logs

### Health Check
- `GET /health` - Health check endpoint

## Security

- Webhook signatures are verified using HMAC SHA256
- Secure session management
- Environment variable protection
- CORS protection
- Helmet.js security headers

## Troubleshooting

### Webhooks Not Working

1. Check webhook registration in Shopify admin
2. Verify webhook URLs are correct
3. Check webhook logs in the admin dashboard
4. Ensure your app URL is accessible from Shopify

### LearnWorlds Connection Issues

1. Verify API credentials are correct
2. Check LearnWorlds API base URL
3. Test connection using the admin dashboard
4. Check API rate limits

### Database Issues

For production, ensure you have a proper database configured:
- MySQL (recommended)
- PostgreSQL
- SQLite (development only)

## Support

For issues and questions:
1. Check the webhook logs in the admin dashboard
2. Review the server logs
3. Verify all environment variables are set correctly

## License

MIT License - feel free to modify and use as needed.