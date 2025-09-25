# GitHub Integration Guide for Shopify-LearnWorlds App

## Step 1: Initialize Git Repository

If you haven't already initialized a git repository, run these commands in your project directory:

```bash
cd c:\Users\Brijesh\Desktop\Credentials\shopify\unenroll
git init
git add .
git commit -m "Initial commit: Shopify-LearnWorlds Integration App"
```

## Step 2: Create a GitHub Repository

### Option A: Using GitHub Web Interface
1. Go to [GitHub.com](https://github.com)
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name your repository (e.g., "shopify-learnworlds-integration")
5. Add description: "Shopify app for automatic LearnWorlds course unenrollment on order refunds"
6. Choose "Public" or "Private" (recommended: Private for development)
7. Don't initialize with README (we already have one)
8. Click "Create repository"

### Option B: Using GitHub CLI (if installed)
```bash
gh repo create shopify-learnworlds-integration --private --description "Shopify app for automatic LearnWorlds course unenrollment"
```

## Step 3: Connect Local Repository to GitHub

After creating the repository, you'll see instructions on GitHub. Run these commands:

```bash
git remote add origin https://github.com/YOUR_USERNAME/shopify-learnworlds-integration.git
git branch -M main
git push -u origin main
```

## Step 4: Configure GitHub Secrets for Vercel Deployment

### Required GitHub Secrets
Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```env
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_APP_URL=https://your-app.vercel.app
SHOPIFY_SCOPES=read_orders,write_orders,read_customers,write_customers
SHOPIFY_API_VERSION=2024-01

LEARNWORLDS_API_BASE=https://your-domain.learnworlds.com/admin/api/v2
LEARNWORLDS_CLIENT_ID=your_learnworlds_client_id
LEARNWORLDS_AUTH_TOKEN=your_learnworlds_auth_token

DATABASE_URL=mysql://username:password@host:port/database_name
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
```

## Step 5: Create GitHub Actions Workflow (Optional)

Create `.github/workflows/deploy.yml` for automated deployment:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        working-directory: ./
```

## Step 6: Connect to Vercel via GitHub

### Method 1: Vercel Dashboard
1. Go to [Vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables
5. Deploy

### Method 2: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

## Step 7: Branch Strategy

### Recommended Branch Structure:
```
main (production)
├── develop (staging)
├── feature/shopify-webhooks
├── feature/admin-dashboard
└── feature/learnworlds-api
```

### Git Workflow:
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to GitHub
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Merge after review
```

## Step 8: Security Best Practices

### 1. Environment Variables
- Never commit `.env` file
- Use GitHub Secrets for sensitive data
- Keep your `.gitignore` updated

### 2. API Keys
- Rotate keys regularly
- Use different keys for different environments
- Monitor API usage

### 3. Repository Settings
- Enable branch protection for main
- Require pull request reviews
- Enable security alerts

## Step 9: Monitoring and Maintenance

### GitHub Features to Enable:
1. **Security Alerts**: Settings → Security
2. **Dependabot**: Settings → Security → Dependabot
3. **Actions**: Settings → Actions → General
4. **Webhooks**: Settings → Webhooks (for deployment notifications)

### Regular Tasks:
- Update dependencies
- Review security alerts
- Monitor deployment logs
- Backup your database

## Troubleshooting

### Common Issues:
1. **Large files**: Use `.gitignore` for node_modules, logs, etc.
2. **Environment variables**: Ensure all required variables are set
3. **Build failures**: Check Vercel deployment logs
4. **Database connection**: Verify DATABASE_URL format

### Support Resources:
- [GitHub Documentation](https://docs.github.com)
- [Vercel Documentation](https://vercel.com/docs)
- [Shopify App Development](https://shopify.dev)

## Quick Commands Reference

```bash
# Status check
git status

# Add all changes
git add .

# Commit with message
git commit -m "feat: description"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# View logs
git log --oneline

# Create new branch
git checkout -b feature-name
```

Your repository is now ready for GitHub integration and Vercel deployment! 🚀