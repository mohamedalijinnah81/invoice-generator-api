@echo off
echo 🚀 Invoice Generator API - Vercel Deployment
echo =============================================

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI is not installed. Installing now...
    npm install -g vercel
)

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Creating example...
    (
        echo # Server Configuration
        echo NODE_ENV=production
        echo PORT=3000
        echo.
        echo # CORS Configuration
        echo ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
        echo.
        echo # Cloudinary Configuration ^(Required for PDF upload^)
        echo CLOUDINARY_CLOUD_NAME=your_cloud_name
        echo CLOUDINARY_API_KEY=your_api_key
        echo CLOUDINARY_API_SECRET=your_api_secret
        echo.
        echo # PDF Generation Configuration
        echo PDF_TIMEOUT=30000
        echo ENABLE_WATERMARK=false
        echo WATERMARK_TEXT=SAMPLE INVOICE
        echo.
        echo # Rate Limiting
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
    ) > .env
    echo 📝 Please update the .env file with your actual values before deploying.
    echo    Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Check if dependencies are installed correctly
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies. Please check your package.json and try again.
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully!

REM Deploy to Vercel
echo 🌐 Deploying to Vercel...
vercel --prod

echo.
echo 🎉 Deployment completed!
echo.
echo 📋 Next steps:
echo 1. Set environment variables in Vercel dashboard
echo 2. Test your API endpoints
echo 3. Check the health endpoint: https://your-project.vercel.app/health
echo 4. View API docs: https://your-project.vercel.app/api/docs
echo.
echo 🔧 Environment variables to set in Vercel:
echo    - CLOUDINARY_CLOUD_NAME
echo    - CLOUDINARY_API_KEY
echo    - CLOUDINARY_API_SECRET
echo    - ALLOWED_ORIGINS ^(optional^)
echo    - PDF_TIMEOUT ^(optional, default: 30000^)
echo    - ENABLE_WATERMARK ^(optional, default: false^)
echo.
echo 📚 For more information, check the README.md file
pause 