# Invoice Generator API - Serverless Version

A dynamic, multi-language, template-based invoice generator API optimized for serverless deployment on Vercel.

## Features

- 🚀 **Serverless Architecture** - Optimized for Vercel deployment
- 📄 **PDF Generation** - Generate professional invoices using Puppeteer
- 🌍 **Multi-language Support** - 10+ languages supported
- 🎨 **Multiple Templates** - 5 professional invoice templates
- ☁️ **Cloud Storage** - Automatic upload to Cloudinary
- 🔒 **Security** - Rate limiting, CORS, and input validation
- 📊 **Health Monitoring** - Built-in health checks

## Quick Start

### Prerequisites

- Node.js 18+ 
- Vercel account
- Cloudinary account

### Environment Variables

Create a `.env` file in your project root with the following variables:

```env
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
```

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. The API will be available at `http://localhost:3000`

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy to Vercel:
```bash
vercel
```

3. Set environment variables in Vercel dashboard:
   - Go to your project settings
   - Navigate to Environment Variables
   - Add all the variables from the `.env` file above

4. Your API will be deployed at `https://your-project.vercel.app`

## API Endpoints

### Generate Invoice
```http
POST /api/generate-invoice
```

**Request Body:**
```json
{
  "invoiceNumber": "INV-001",
  "companyName": "Tech Corp",
  "productOrService": [
    {
      "name": "Web Development",
      "quantity": 1,
      "price": 1500
    }
  ],
  "taxPercent": 21,
  "currency": "USD",
  "date": "2025-01-24",
  "locale": "en",
  "template": 1
}
```

**Response:**
```json
{
  "success": true,
  "invoiceUrl": "https://res.cloudinary.com/...",
  "invoiceNumber": "INV-001",
  "total": "1815.00",
  "currency": "USD",
  "generatedAt": "2025-01-24T10:30:00.000Z",
  "fileSize": "245 KB"
}
```

### Get Templates
```http
GET /api/templates
```

### Get Locales
```http
GET /api/locales
```

### Health Check
```http
GET /health
```

### API Documentation
```http
GET /api/docs
```

## Supported Features

### Languages
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Dutch (nl)
- Italian (it)
- Portuguese (pt)
- Swedish (sv)
- Norwegian (no)
- Danish (da)

### Currencies
- USD, EUR, GBP, CAD, AUD
- JPY, CHF, SEK, NOK, DKK

### Templates
- Template 1-5: Professional invoice layouts

## Serverless Optimizations

This version has been optimized for serverless deployment:

- **Puppeteer Core**: Uses `puppeteer-core` with `chrome-aws-lambda` for serverless compatibility
- **No Persistent State**: Removed browser instance persistence
- **Optimized Timeouts**: Reduced timeouts for serverless execution
- **Memory Management**: Improved cleanup and memory usage
- **Error Handling**: Enhanced error handling for serverless environment

## Configuration

### Vercel Configuration

The `vercel.json` file is pre-configured for optimal serverless deployment:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "app.js"
    },
    {
      "src": "/health",
      "dest": "app.js"
    },
    {
      "src": "/(.*)",
      "dest": "app.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "app.js": {
      "maxDuration": 30
    }
  }
}
```

### Environment Variables in Vercel

Set these in your Vercel project dashboard:

1. Go to Project Settings
2. Navigate to Environment Variables
3. Add each variable with the appropriate value
4. Deploy to apply changes

## Troubleshooting

### Common Issues

1. **PDF Generation Timeout**
   - Increase `PDF_TIMEOUT` environment variable
   - Check if content is too complex

2. **Cloudinary Upload Failures**
   - Verify Cloudinary credentials
   - Check file size limits

3. **Rate Limiting**
   - Adjust rate limit settings in environment variables
   - Check if requests are coming from the same IP

### Performance Tips

- Use appropriate template sizes
- Optimize invoice content
- Consider using CDN for static assets
- Monitor function execution times

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation at `/api/docs`
- Review the health check at `/health` 