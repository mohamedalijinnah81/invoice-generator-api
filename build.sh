#!/bin/bash

# Build script for Render deployment
echo "🔧 Building for Render deployment..."

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Install Chrome for Puppeteer
echo "🌐 Installing Chrome for Puppeteer..."
npx puppeteer browsers install chrome

# Verify Chrome installation
echo "✅ Verifying Chrome installation..."
if npx puppeteer browsers list | grep -q "chrome"; then
    echo "✅ Chrome installed successfully"
else
    echo "❌ Chrome installation failed"
    exit 1
fi

echo "🎉 Build completed successfully!" 