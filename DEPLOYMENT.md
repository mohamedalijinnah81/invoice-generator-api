# Vercel Deployment Guide - Fixed Version

## Issues Fixed

1. **Rate Limiting Error**: Added `app.set('trust proxy', 1)` and `trustProxy: true` to rate limiter
2. **PDF Generation**: Switched from `@sparticuz/chromium` to full `puppeteer` package
3. **System Libraries**: Removed dependency on problematic system libraries

## Current Configuration

- **PDF Generator**: Uses full Puppeteer with serverless-optimized arguments
- **Rate Limiting**: Properly configured for Vercel proxy
- **Dependencies**: Simplified to avoid system library conflicts

## Deployment Steps

### 1. Commit and Push Changes
```bash
git add .
git commit -m "Fix Vercel deployment - trust proxy and full Puppeteer"
git push origin main
```

### 2. Deploy to Vercel
```bash
vercel --prod
```

### 3. Set Environment Variables
In Vercel dashboard, set these environment variables:

**Required:**
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**Optional:**
- `ALLOWED_ORIGINS` (comma-separated list)
- `ENABLE_WATERMARK` (set to 'true' for watermarks)
- `WATERMARK_TEXT` (custom watermark text)

### 4. Test the Deployment

#### Test PDF Generation
```bash
curl https://your-vercel-app.vercel.app/api/test -o test.pdf
```

#### Test Health Check
```bash
curl https://your-vercel-app.vercel.app/health
```

#### Test Main API
```bash
curl -X POST https://your-vercel-app.vercel.app/api/generate-invoice \
  -H "Content-Type: application/json" \
  -d '{"template": "template1", "locale": "en", "data": {...}}'
```

## Expected Behavior

After deployment:
- ✅ No more rate limiting errors
- ✅ PDF generation works with full Puppeteer
- ✅ No system library dependency issues
- ✅ Proper IP detection through proxy

## Troubleshooting

If issues persist:
1. Check Vercel function logs
2. Test `/api/test` endpoint first
3. Verify environment variables are set
4. Ensure latest code is deployed

## File Changes Made

- `app.js`: Added trust proxy settings
- `services/pdfGenerator.js`: Switched to full Puppeteer
- `package.json`: Removed `@sparticuz/chromium` and `puppeteer-core`
- `api/test.js`: Added test endpoint for debugging 