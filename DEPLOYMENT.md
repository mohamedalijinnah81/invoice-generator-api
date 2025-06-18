# Vercel Deployment Guide - Chrome-Free Version

## Issues Fixed

1. **Rate Limiting Error**: Added `app.set('trust proxy', 1)` and `trustProxy: true` to rate limiter
2. **PDF Generation**: Switched from Puppeteer to pdf-lib (Chrome-free approach)
3. **System Libraries**: Completely eliminated Chrome dependency

## Current Configuration

- **PDF Generator**: Uses pdf-lib (no Chrome required)
- **Rate Limiting**: Properly configured for Vercel proxy
- **Dependencies**: Minimal, Chrome-free package structure

## Key Changes

- ✅ **No Chrome dependency**: Uses pdf-lib instead of Puppeteer
- ✅ **Works in Vercel**: No system library issues
- ✅ **Simplified**: Basic PDF generation without browser
- ✅ **Reliable**: No executable path or cache issues

## Deployment Steps

### 1. Commit and Push Changes
```bash
git add .
git commit -m "Switch to Chrome-free PDF generation with pdf-lib"
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
- ✅ PDF generation works without Chrome
- ✅ No system library dependency issues
- ✅ Proper IP detection through proxy
- ✅ Basic PDF generation with text content

## Limitations

The new pdf-lib approach has some limitations:
- **Basic formatting**: Limited compared to full HTML rendering
- **No CSS**: Styling is simplified
- **Text-based**: Images and complex layouts are not supported
- **Simple extraction**: HTML is converted to basic text

## Troubleshooting

If issues persist:
1. Check Vercel function logs
2. Test `/api/test` endpoint first
3. Verify environment variables are set
4. Ensure latest code is deployed

## File Changes Made

- `app.js`: Added trust proxy settings
- `services/pdfGenerator.js`: Completely rewritten to use pdf-lib
- `package.json`: Removed Puppeteer, added pdf-lib
- `api/test.js`: Updated for new PDF generator 