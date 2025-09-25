@echo off
echo 🚀 Vercel Deployment Setup for Shopify-LearnWorlds Integration
echo.

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel@latest
    echo.
)

echo 📋 Environment Variables Setup Guide
echo =====================================
echo.
echo Before deploying, you need to set these environment variables in Vercel:
echo.
echo 🔑 Required Environment Variables:
echo    SHOPIFY_API_KEY=your_shopify_api_key_here
echo    SHOPIFY_API_SECRET=your_shopify_api_secret_here
echo    SHOPIFY_APP_URL=https://your-app.vercel.app
echo    LEARNWORLDS_CLIENT_ID=your_learnworlds_client_id_here
echo    LEARNWORLDS_AUTH_TOKEN=your_learnworlds_auth_token_here
echo    JWT_SECRET=your_jwt_secret_key_here
echo    DATABASE_URL=mysql://username:password@host:port/database_name
echo.
echo 📝 To add these variables:
echo 1. Go to: https://vercel.com/dashboard
echo 2. Select your project: learnworld-unenroll
echo 3. Go to: Settings → Environment Variables
echo 4. Add each variable one by one
echo.

set /p deploy_now=Ready to deploy? (y/n): 
if /i "%deploy_now%"=="y" (
    echo 🚀 Deploying to Vercel...
    vercel --prod
) else (
    echo ✅ Setup guide complete. Run 'vercel --prod' when ready to deploy.
)

echo.
echo 📚 For detailed instructions, see VERCEL_DEPLOYMENT.md
echo.
pause