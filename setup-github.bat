@echo off
echo 🚀 Setting up GitHub repository for Shopify-LearnWorlds Integration...
echo.

REM Check if git is initialized
if not exist ".git" (
    echo 📁 Initializing git repository...
    git init
)

REM Check if remote already exists
git remote get-url origin >nul 2>&1
if %errorlevel% equ 0 (
    echo 🔗 Remote repository already configured.
    git remote -v
) else (
    echo 🔗 Please enter your GitHub repository URL:
    echo Example: https://github.com/YOUR_USERNAME/shopify-learnworlds-integration.git
    set /p repo_url=Repository URL: 
    
    git remote add origin %repo_url%
    echo ✅ Remote repository added: %repo_url%
)

REM Create main branch if it doesn't exist
git branch | findstr "main" >nul
if %errorlevel% neq 0 (
    echo 🌿 Creating main branch...
    git checkout -b main
)

REM Add all files
echo 📦 Adding files to git...
git add .

REM Check if there are changes to commit
git diff --staged --quiet
if %errorlevel% equ 0 (
    echo ✅ No changes to commit. Repository is up to date.
) else (
    echo 💾 Committing files...
    git commit -m "feat: initial commit - Shopify-LearnWorlds Integration App
    
- Complete Shopify app with LearnWorlds integration
- Automatic course unenrollment on order refunds/cancellations
- Admin dashboard for user management
- Webhook handlers for Shopify events
- Vercel deployment ready
- SQLite database for development"
    
    echo 🚀 Pushing to GitHub...
    git push -u origin main
)

echo.
echo ✅ GitHub repository setup complete!
echo.
echo 📋 Next steps:
echo 1. Go to your GitHub repository settings
echo 2. Add environment variables as GitHub Secrets (see GITHUB_SETUP.md)
echo 3. Connect to Vercel for deployment
echo 4. Configure your Shopify app with the webhook URLs
echo.
echo 🔗 Your repository should be available at:
git remote get-url origin

echo.
echo Press any key to exit...
pause >nul