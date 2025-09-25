#!/bin/bash
# GitHub Repository Setup Script for Shopify-LearnWorlds Integration

echo "🚀 Setting up GitHub repository for Shopify-LearnWorlds Integration..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
fi

# Check if remote already exists
if git remote get-url origin >/dev/null 2>&1; then
    echo "🔗 Remote repository already configured."
    git remote -v
else
    echo "🔗 Please enter your GitHub repository URL:"
    echo "Example: https://github.com/YOUR_USERNAME/shopify-learnworlds-integration.git"
    read -r repo_url
    
    git remote add origin "$repo_url"
    echo "✅ Remote repository added: $repo_url"
fi

# Create main branch if it doesn't exist
if ! git branch | grep -q "main"; then
    echo "🌿 Creating main branch..."
    git checkout -b main
fi

# Add all files
echo "📦 Adding files to git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "✅ No changes to commit. Repository is up to date."
else
    echo "💾 Committing files..."
    git commit -m "feat: initial commit - Shopify-LearnWorlds Integration App
    
    - Complete Shopify app with LearnWorlds integration
    - Automatic course unenrollment on order refunds/cancellations
    - Admin dashboard for user management
    - Webhook handlers for Shopify events
    - Vercel deployment ready
    - SQLite database for development"
    
    echo "🚀 Pushing to GitHub..."
    git push -u origin main
fi

echo ""
echo "✅ GitHub repository setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your GitHub repository settings"
echo "2. Add environment variables as GitHub Secrets (see GITHUB_SETUP.md)"
echo "3. Connect to Vercel for deployment"
echo "4. Configure your Shopify app with the webhook URLs"
echo ""
echo "🔗 Your repository should be available at:"
git remote get-url origin