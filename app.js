const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const invoiceRoutes = require('./routes/invoice');

const app = express();

// Trust proxy for Vercel (fixes rate limiting issues)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: false
}));

// Rate limiting (optimized for serverless)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Trust proxy for accurate IP detection
  trustProxy: true
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (for serverless, this will be handled by Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.use('/static', express.static(path.join(__dirname, 'public')));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    platform: 'serverless'
  });
});

// API routes
app.use('/api', invoiceRoutes);

// Test endpoint for debugging
app.get('/api/test', async (req, res) => {
  const test = require('./api/test');
  return test(req, res);
});

// Root endpoint with API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'Invoice Generator API',
    version: '1.0.0',
    description: 'Dynamic, Multi-language, Template-based Invoice Generator (Serverless)',
    platform: 'Vercel Serverless',
    endpoints: {
      'POST /api/generate-invoice': 'Generate invoice PDF',
      'GET /health': 'Health check',
      'GET /api/templates': 'List available templates',
      'GET /api/locales': 'List supported languages',
      'GET /api/docs': 'API documentation',
      'GET /api/test': 'Test PDF generation (debug)'
    },
    documentation: 'https://github.com/your-repo/invoice-generator-api',
    support: 'support@yourapi.com'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.method} ${req.originalUrl} was not found.`,
    availableEndpoints: [
      'POST /api/generate-invoice',
      'GET /health',
      'GET /api/templates',
      'GET /api/locales',
      'GET /api/docs',
      'GET /api/test'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Validation errors
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.details[0].message,
      field: err.details[0].path.join('.')
    });
  }

  // Cloudinary errors
  if (err.name === 'CloudinaryError') {
    return res.status(500).json({
      error: 'File Upload Error',
      message: 'Failed to upload PDF to cloud storage'
    });
  }

  // Puppeteer errors
  if (err.message && err.message.includes('Protocol error')) {
    return res.status(500).json({
      error: 'PDF Generation Error',
      message: 'Failed to generate PDF document'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
});

// Serverless export for Vercel
module.exports = app;

// Only start server if not in serverless environment
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 4000;
  
  app.listen(PORT, () => {
    console.log(`🚀 Invoice Generator API running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Access: http://localhost:${PORT}`);
  });
}