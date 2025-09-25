# Shopify-LearnWorlds Integration

A comprehensive Shopify app that integrates with LearnWorlds to automatically unenroll users from courses when orders are refunded or cancelled.

## Features

- **Automatic Unenrollment**: Automatically unenroll users from LearnWorlds courses when Shopify orders are refunded or cancelled
- **Webhook Integration**: Secure webhook handlers for Shopify order events
- **Admin Dashboard**: Beautiful admin interface for managing the integration
- **User Management**: Manually enroll/unenroll users from courses
- **Webhook Logs**: Track and monitor all webhook events
- **Multi-shop Support**: Support for multiple Shopify stores
- **Vercel Deployment**: Ready for deployment on Vercel with GitHub integration

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