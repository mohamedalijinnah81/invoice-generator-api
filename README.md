# Invoice Generator API

A dynamic, multi-language, template-based invoice generator API optimized for deployment on Render. Generate professional PDF invoices with full HTML/CSS template support.

## Features

- 🚀 **Traditional Server Architecture** - Optimized for Render deployment
- 📄 **PDF Generation** - Generate professional invoices using Puppeteer with fallback
- 🌍 **Multi-language Support** - 10+ languages supported
- 🎨 **Multiple Templates** - 5 professional invoice templates
- ☁️ **Cloud Storage** - Automatic upload to Cloudinary
- 🔒 **Security** - Rate limiting, CORS, and comprehensive input validation
- 📊 **Health Monitoring** - Built-in health checks
- 🔄 **Fallback Support** - Dual PDF generation methods for reliability

## Quick Start

### Prerequisites

- Node.js 18+ 
- Render account
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

### Render Deployment

1. Push your code to Git repository
2. Connect to Render and create a new Web Service
3. Set environment variables in Render dashboard
4. Deploy!

See `RENDER_DEPLOYMENT.md` for detailed deployment instructions.

## API Documentation

### Generate Invoice
```http
POST /api/generate-invoice
Content-Type: application/json
```

### Request Parameters

#### **Mandatory Parameters**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `invoiceNumber` | string | Unique invoice identifier (max 50 chars) | `"INV-2024-001"` |
| `companyName` | string | Name of the selling company (max 200 chars) | `"Tech Solutions Ltd"` |
| `productOrService` | array | Array of products/services (1-50 items) | See example below |
| `taxPercent` | number | Tax percentage (0-100) | `21` |
| `currency` | string | Currency code | `"USD"` |
| `date` | string | Invoice date (YYYY-MM-DD format) | `"2024-01-15"` |

#### **Optional Parameters**

| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `buyerCompany` | object | Buyer company information | - | See company object below |
| `sellerCompany` | object | Seller company information | - | See company object below |
| `shippingAmount` | number | Shipping cost | `0` | `25.50` |
| `serviceFee` | number | Service fee amount | `0` | `15.00` |
| `discount` | number | Discount percentage (0-100) | - | `10` |
| `dueDate` | string | Payment due date (YYYY-MM-DD) | - | `"2024-02-15"` |
| `companyLogo` | string | Company logo URL | - | `"https://example.com/logo.png"` |
| `locale` | string | Language/locale | `"en"` | `"es"` |
| `template` | number | Template number (1-5) | `1` | `2` |
| `notes` | string | Additional notes (max 1000 chars) | - | `"Payment due within 30 days"` |
| `paymentTerms` | string | Payment terms (max 500 chars) | - | `"Net 30"` |
| `watermark` | boolean | Enable watermark | `false` | `true` |
| `theme` | string | Color theme | `"light"` | `"dark"` |
| `customFields` | object | Custom fields (max 10) | - | `{"field1": "value1"}` |

### Data Structures

#### **Product/Service Item Object**
```json
{
  "name": "string (required, max 200 chars)",
  "quantity": "number (required, positive)",
  "price": "number (required, positive)",
  "description": "string (optional, max 500 chars)"
}
```

#### **Company Object**
```json
{
  "name": "string (required, max 200 chars)",
  "address": "string (optional, max 500 chars)",
  "taxNumber": "string (optional, max 50 chars)",
  "vatNumber": "string (optional, max 50 chars)",
  "bankAccount": "string (optional, max 100 chars)",
  "phone": "string (optional, max 20 chars)",
  "email": "string (optional, valid email)",
  "website": "string (optional, valid URL)"
}
```

### Supported Values

#### **Currencies**
- `USD` - US Dollar
- `EUR` - Euro
- `GBP` - British Pound
- `CAD` - Canadian Dollar
- `AUD` - Australian Dollar
- `JPY` - Japanese Yen
- `CHF` - Swiss Franc
- `SEK` - Swedish Krona
- `NOK` - Norwegian Krone
- `DKK` - Danish Krone

#### **Locales (Languages)**
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `nl` - Dutch
- `it` - Italian
- `pt` - Portuguese
- `sv` - Swedish
- `no` - Norwegian
- `da` - Danish

#### **Templates**
- `1` - Professional Template 1
- `2` - Professional Template 2
- `3` - Professional Template 3
- `4` - Professional Template 4
- `5` - Professional Template 5

#### **Themes**
- `light` - Light theme
- `dark` - Dark theme
- `blue` - Blue theme
- `green` - Green theme

### Request Examples

#### **Minimal Request**
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
  "date": "2024-01-15"
}
```

#### **Complete Request**
```json
{
  "invoiceNumber": "INV-2024-002",
  "companyName": "Tech Solutions Ltd",
  "productOrService": [
    {
      "name": "Website Design",
      "quantity": 1,
      "price": 2000,
      "description": "Custom website design with responsive layout"
    },
    {
      "name": "SEO Optimization",
      "quantity": 3,
      "price": 300,
      "description": "Monthly SEO services"
    }
  ],
  "taxPercent": 21,
  "currency": "EUR",
  "date": "2024-01-15",
  "dueDate": "2024-02-15",
  "locale": "en",
  "template": 2,
  "buyerCompany": {
    "name": "Client Corp",
    "address": "123 Business St, City, Country",
    "taxNumber": "TAX123456",
    "email": "billing@clientcorp.com"
  },
  "sellerCompany": {
    "name": "Tech Solutions Ltd",
    "address": "456 Tech Ave, Tech City, Country",
    "vatNumber": "VAT789012",
    "phone": "+1-555-0123",
    "email": "billing@techsolutions.com",
    "website": "https://techsolutions.com"
  },
  "shippingAmount": 25.50,
  "serviceFee": 15.00,
  "discount": 10,
  "companyLogo": "https://techsolutions.com/logo.png",
  "notes": "Payment due within 30 days. Late payments subject to 2% monthly fee.",
  "paymentTerms": "Net 30",
  "watermark": false,
  "theme": "light",
  "customFields": {
    "projectCode": "PRJ-2024-001",
    "department": "Marketing"
  }
}
```

### Response Format

#### **Success Response**
```json
{
  "success": true,
  "invoiceUrl": "https://res.cloudinary.com/your-cloud/...",
  "invoiceNumber": "INV-2024-002",
  "total": "2481.00",
  "currency": "EUR",
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "fileSize": "245 KB"
}
```

#### **Error Response**
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invoice number is required",
  "field": "invoiceNumber"
}
```

### Other Endpoints

#### **Get Available Templates**
```http
GET /api/templates
```

#### **Get Supported Locales**
```http
GET /api/locales
```

#### **Health Check**
```http
GET /health
```

#### **Test PDF Generation**
```http
GET /api/test
```

## Validation Rules

### **General Rules**
- All string fields are automatically trimmed
- Numbers support up to 2 decimal places
- Dates must be in YYYY-MM-DD format
- URLs must be valid HTTP/HTTPS URLs
- Email addresses must be valid format

### **Business Rules**
- Due date cannot be before invoice date
- Invoice date cannot be more than 1 year in the future
- Invoice total cannot exceed $1,000,000
- At least one product/service item is required
- Maximum 50 items per invoice

### **Field Limits**
- Invoice number: 1-50 characters
- Company name: 1-200 characters
- Product name: 1-200 characters
- Product description: 0-500 characters
- Notes: 0-1000 characters
- Payment terms: 0-500 characters
- Company address: 0-500 characters
- Tax/VAT numbers: 0-50 characters

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `400` - Validation error (with field details)
- `429` - Rate limit exceeded
- `500` - Server error

## Rate Limiting

- **Free Plan**: 100 requests per 15 minutes per IP
- **Production**: Configurable via environment variables

## PDF Generation

The API uses a dual approach for PDF generation:

1. **Primary Method**: Puppeteer with Chrome
   - Full HTML/CSS template rendering
   - Best quality and feature support

2. **Fallback Method**: html-pdf-node
   - Basic HTML to PDF conversion
   - Works even if Chrome is not available

## Deployment

This API is optimized for deployment on Render. See `RENDER_DEPLOYMENT.md` for detailed deployment instructions.

## Support

For issues and questions:
1. Check the health endpoint: `/health`
2. Test PDF generation: `/api/test`
3. Review Render logs for detailed error messages
4. Verify environment variables are set correctly 
