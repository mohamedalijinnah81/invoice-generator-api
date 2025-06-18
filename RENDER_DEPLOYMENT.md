# Render Deployment Guide

## Overview

This guide will help you deploy your Invoice Generator API to Render's traditional Node.js hosting platform. Render supports full Node.js applications with persistent processes, which means you can use Puppeteer with Chrome without any serverless limitations.

## Prerequisites

- A Render account (free tier available)
- Your code pushed to a Git repository (GitHub, GitLab, etc.)
- Cloudinary account for PDF storage

## Step 1: Prepare Your Repository

Make sure your repository has the following files:
- `package.json` (with correct dependencies)
- `app.js` (main application file)
- `render.yaml` (Render configuration)
- `.env` file (for local development)

## Step 2: Deploy to Render

### Option A: Using render.yaml (Recommended)

1. **Push your code to Git repository**
   ```bash
   git add .
   git commit -m "Configure for Render deployment with Chrome installation"
   git push origin main
   ```

2. **Connect to Render**
   - Go to [render.com](https://render.com)
   - Sign up/Login
   - Click "New +" → "Web Service"
   - Connect your Git repository
   - Render will automatically detect the `render.yaml` file

3. **Configure Environment Variables**
   In the Render dashboard, add these environment variables:
   
   **Required:**
   - `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY` - Your Cloudinary API key
   - `CLOUDINARY_API_SECRET` - Your Cloudinary API secret
   
   **Optional:**
   - `ALLOWED_ORIGINS` - Comma-separated list of allowed origins (default: "*")
   - `ENABLE_WATERMARK` - Set to "true" to enable watermarks
   - `WATERMARK_TEXT` - Custom watermark text

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application

### Option B: Manual Configuration

1. **Create Web Service**
   - Go to Render dashboard
   - Click "New +" → "Web Service"
   - Connect your Git repository

2. **Configure Service**
   - **Name**: `invoice-generator-api`
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

3. **Add Environment Variables** (same as above)

4. **Deploy**

## Step 3: Test Your Deployment

Once deployed, test your application:

### Health Check
```bash
curl https://your-app-name.onrender.com/health
```

### Test PDF Generation
```bash
curl https://your-app-name.onrender.com/api/test -o test.pdf
```

### Test Main API
```bash
curl -X POST https://your-app-name.onrender.com/api/generate-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "template": "template1",
    "locale": "en",
    "data": {
      "invoiceNumber": "INV-001",
      "date": "2024-01-01",
      "dueDate": "2024-01-31",
      "client": {
        "name": "Test Client",
        "email": "client@example.com"
      },
      "items": [
        {
          "description": "Test Item",
          "quantity": 1,
          "price": 100
        }
      ]
    }
  }'
```

## Step 4: Configure Custom Domain (Optional)

1. In Render dashboard, go to your service
2. Click "Settings" → "Custom Domains"
3. Add your domain and configure DNS

## Environment Variables Reference

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `CLOUDINARY_CLOUD_NAME` | Yes | Your Cloudinary cloud name | - |
| `CLOUDINARY_API_KEY` | Yes | Your Cloudinary API key | - |
| `CLOUDINARY_API_SECRET` | Yes | Your Cloudinary API secret | - |
| `ALLOWED_ORIGINS` | No | Comma-separated allowed origins | "*" |
| `ENABLE_WATERMARK` | No | Enable watermarks on PDFs | "false" |
| `WATERMARK_TEXT` | No | Custom watermark text | "SAMPLE INVOICE" |
| `NODE_ENV` | No | Environment mode | "production" |
| `PORT` | No | Server port | 3000 |

## Troubleshooting

### Common Issues

1. **Chrome Not Found Error**
   - The build process now includes `npx puppeteer browsers install chrome`
   - If Puppeteer fails, the app will automatically use a fallback PDF generator
   - Check Render logs for build success

2. **Build Fails**
   - Check that all dependencies are in `package.json`
   - Ensure Node.js version is compatible (>=18.0.0)
   - The build script installs Chrome automatically

3. **PDF Generation Fails**
   - The app has a fallback PDF generator using `html-pdf-node`
   - Check Render logs for which method is being used
   - Both Puppeteer and fallback methods are tried

4. **Environment Variables Not Set**
   - Double-check variable names in Render dashboard
   - Ensure no extra spaces in values

5. **Rate Limiting Issues**
   - The app is configured with trust proxy for Render
   - Check if you're hitting rate limits

### Checking Logs

1. Go to your service in Render dashboard
2. Click "Logs" tab
3. Check for any error messages
4. Look for "Puppeteer failed, trying fallback method" messages

### Performance Tips

- **Free Plan**: Limited to 750 hours/month, spins down after 15 minutes of inactivity
- **Paid Plans**: Better performance, no spin-down, more resources
- **Memory**: Consider upgrading if you need more memory for PDF generation

## PDF Generation Methods

The application uses a dual approach for PDF generation:

1. **Primary Method**: Puppeteer with Chrome
   - Full HTML/CSS template rendering
   - Best quality and feature support
   - Requires Chrome to be installed

2. **Fallback Method**: html-pdf-node
   - Basic HTML to PDF conversion
   - Works even if Chrome is not available
   - Limited CSS support but functional

## Expected Behavior

After successful deployment:
- ✅ Health check endpoint works
- ✅ PDF generation works (either Puppeteer or fallback)
- ✅ No Chrome executable issues (fallback handles this)
- ✅ Proper rate limiting
- ✅ Cloudinary integration works

## Support

If you encounter issues:
1. Check Render logs first
2. Verify environment variables are set correctly
3. Test locally to ensure code works
4. Check Render documentation: https://render.com/docs

## Cost

- **Free Plan**: $0/month (750 hours, spins down after inactivity)
- **Paid Plans**: Starting from $7/month (always on, better performance)

The free plan is perfect for testing and small projects! 