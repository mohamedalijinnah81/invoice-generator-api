#!/bin/bash

# Invoice Generator API - Vercel Deployment Script

echo "🚀 Invoice Generator API - Vercel Deployment"
echo "============================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing now..."
    npm install -g vercel
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating example..."
    cat > .env << EOF
# Server Configuration
NODE_ENV=production
PORT=3000

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Cloudinary Configuration (Required for PDF upload)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# PDF Generation Configuration
PDF_TIMEOUT=30000
ENABLE_WATERMARK=false
WATERMARK_TEXT=SAMPLE INVOICE

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    echo "📝 Please update the .env file with your actual values before deploying."
    echo "   Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if dependencies are installed correctly
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies. Please check your package.json and try again."
    exit 1
fi

echo "✅ Dependencies installed successfully!"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Test your API endpoints"
echo "3. Check the health endpoint: https://your-project.vercel.app/health"
echo "4. View API docs: https://your-project.vercel.app/api/docs"
echo ""
echo "🔧 Environment variables to set in Vercel:"
echo "   - CLOUDINARY_CLOUD_NAME"
echo "   - CLOUDINARY_API_KEY" 
echo "   - CLOUDINARY_API_SECRET"
echo "   - ALLOWED_ORIGINS (optional)"
echo "   - PDF_TIMEOUT (optional, default: 30000)"
echo "   - ENABLE_WATERMARK (optional, default: false)"
echo ""
echo "📚 For more information, check the README.md file" 