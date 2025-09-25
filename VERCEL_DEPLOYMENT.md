# Vercel Deployment Guide for Shopify-LearnWorlds Integration

## 🚀 Quick Deployment Steps

### Step 1: Set Environment Variables in Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `learnworld-unenroll`
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```env
# Shopify Configuration
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here
SHOPIFY_APP_URL=https://your-app.vercel.app
SHOPIFY_SCOPES=read_orders,write_orders,read_customers,write_customers
SHOPIFY_API_VERSION=2024-01

# LearnWorlds Configuration
LEARNWORLDS_API_BASE=https://your-domain.learnworlds.com/admin/api/v2
LEARNWORLDS_CLIENT_ID=your_learnworlds_client_id_here
LEARNWORLDS_AUTH_TOKEN=your_learnworlds_auth_token_here

# Database Configuration
DATABASE_URL=mysql://username:password@host:port/database_name

# Security
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=production
```

### Step 2: Update Your Local Environment

Make sure your local `.env` file has the same variables:

```bash
# Copy from .env.example
cp .env.example .env

# Edit .env with your actual values
```

### Step 3: Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI globally
npm i -g vercel@latest

# Deploy to production
vercel --prod
```

#### Option B: Using GitHub Integration
1. Push your changes to GitHub:
```bash
git add .
git commit -m "feat: update vercel configuration"
git push origin main
```

2. Vercel will automatically deploy from your GitHub repository

### Step 4: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

## 🔧 Environment Variables Setup

### Required Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `SHOPIFY_API_KEY` | Your Shopify app API key | `abc123def456` |
| `SHOPIFY_API_SECRET` | Your Shopify app secret | `xyz789uvw012` |
| `SHOPIFY_APP_URL` | Your app URL (Vercel domain) | `https://shopify-app.vercel.app` |
| `LEARNWORLDS_CLIENT_ID` | LearnWorlds API client ID | `your_client_id` |
| `LEARNWORLDS_AUTH_TOKEN` | LearnWorlds API auth token | `O4EwphUJmAjwegMMAxMYGZBpeewtpxF2PXrAv8yX` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key-here` |
| `DATABASE_URL` | MySQL database connection string | `mysql://user:pass@host:3306/db` |

### Optional Variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SHOPIFY_SCOPES` | Shopify API scopes | `read_orders,write_orders,read_customers,write_customers` |
| `SHOPIFY_API_VERSION` | Shopify API version | `2024-01` |
| `NODE_ENV` | Environment mode | `production` |

## 📝 Deployment Checklist

### Before Deployment:
- [ ] All environment variables are set in Vercel dashboard
- [ ] Your `.env` file is properly configured locally
- [ ] You've tested the app locally (`npm run dev`)
- [ ] Database is accessible from Vercel
- [ ] Shopify app is configured with correct webhook URLs

### After Deployment:
- [ ] Test the main URL: `https://your-app.vercel.app/health`
- [ ] Test admin dashboard: `https://your-app.vercel.app/admin`
- [ ] Configure Shopify webhooks to point to Vercel URL
- [ ] Test the complete flow (order → enrollment → refund → unenrollment)

## 🛠️ Troubleshooting

### Common Issues:

#### 1. Environment Variables Missing
**Error**: `Environment Variable "SHOPIFY_API_KEY" references Secret "shopify_api_key", which does not exist.`

**Solution**: Add all required environment variables in Vercel dashboard.

#### 2. Database Connection Issues
**Error**: `SequelizeHostNotFoundError: getaddrinfo ENOTFOUND host`

**Solution**: 
- Ensure your database allows connections from Vercel IP ranges
- Use a proper database URL format
- Consider using a managed database service

#### 3. Build Failures
**Error**: Module not found or build errors

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Then redeploy
vercel --prod
```

#### 4. Webhook Issues
**Problem**: Shopify webhooks not working after deployment

**Solution**:
- Update webhook URLs in Shopify app to use Vercel domain
- Ensure HTTPS is enabled (Vercel provides SSL automatically)
- Verify webhook secrets match

## 🔐 Security Best Practices

### Environment Variables:
- Never commit `.env` file to GitHub
- Use different API keys for development and production
- Rotate secrets regularly
- Use strong JWT secrets (minimum 32 characters)

### Database Security:
- Use connection pooling
- Enable SSL for database connections
- Restrict database access to specific IP ranges
- Regular backups

### App Security:
- Validate all webhook signatures
- Use HTTPS everywhere
- Implement rate limiting
- Monitor for suspicious activity

## 📊 Monitoring

### Vercel Analytics:
- Enable Web Analytics in Vercel dashboard
- Monitor function execution times
- Track error rates
- Set up alerts for downtime

### Custom Monitoring:
- Add health check endpoints
- Implement logging with services like LogDNA or Papertrail
- Set up uptime monitoring (Pingdom, UptimeRobot)

## 🔄 Continuous Deployment

### GitHub Integration:
1. Connect your GitHub repository to Vercel
2. Enable automatic deployments
3. Configure deployment previews for pull requests
4. Set up branch protection for main branch

### Deployment Workflow:
```bash
# Make changes locally
git add .
git commit -m "feat: new feature"
git push origin main

# Vercel automatically deploys from GitHub
# Monitor deployment in Vercel dashboard
```

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review environment variable configuration
3. Test locally first
4. Check Shopify app settings
5. Verify LearnWorlds API credentials

For additional help, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Shopify App Development](https://shopify.dev)
- [LearnWorlds API Documentation](https://docs.learnworlds.com)

## 🎉 Success!

Once deployed successfully, your app will be available at:
- **Main App**: `https://your-app.vercel.app`
- **Admin Dashboard**: `https://your-app.vercel.app/admin`
- **Health Check**: `https://your-app.vercel.app/health`

Happy deploying! 🚀