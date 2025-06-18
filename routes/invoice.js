const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const { validateInvoiceData } = require('../utils/validation');
const { generatePDF } = require('../services/pdfGenerator');
const { uploadToCloudinary } = require('../services/uploadToCloudinary');
const { renderTemplate, getAvailableTemplates, getAvailableLocales } = require('../services/templateEngine');

// Generate Invoice endpoint
router.post('/generate-invoice', async (req, res) => {
  try {
    // Validate input data
    const { error, value } = validateInvoiceData(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.details[0].message,
        field: error.details[0].path.join('.')
      });
    }

    const invoiceData = value;

    // Set defaults
    invoiceData.template = invoiceData.template || 1;
    invoiceData.locale = invoiceData.locale || 'en';
    invoiceData.currency = invoiceData.currency || 'USD';
    invoiceData.date = invoiceData.date || new Date().toISOString().split('T')[0];

    // Calculate totals
    const subtotal = invoiceData.productOrService.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);

    const taxAmount = (subtotal * (invoiceData.taxPercent || 0)) / 100;
    const shippingAmount = invoiceData.shippingAmount || 0;
    const serviceFee = invoiceData.serviceFee || 0;
    const total = subtotal + taxAmount + shippingAmount + serviceFee;

    // Prepare data for template
    const templateData = {
      ...invoiceData,
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      shippingAmount: shippingAmount.toFixed(2),
      serviceFee: serviceFee.toFixed(2),
      generatedAt: new Date().toISOString()
    };

    // Render HTML template
    const html = await renderTemplate(templateData);

    // Generate PDF
    const pdfBuffer = await generatePDF(html);

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(pdfBuffer, invoiceData.invoiceNumber);

    // Return success response
    res.status(200).json({
      success: true,
      invoiceUrl: uploadResult.secure_url,
      invoiceNumber: invoiceData.invoiceNumber,
      total: total.toFixed(2),
      currency: invoiceData.currency,
      generatedAt: new Date().toISOString(),
      fileSize: Math.round(pdfBuffer.length / 1024) + ' KB'
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Invoice Generation Failed',
      message: process.env.NODE_ENV === 'production' 
        ? 'An error occurred while generating the invoice' 
        : error.message
    });
  }
});

// Get available templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await getAvailableTemplates();

    res.json({
      success: true,
      templates,
      total: templates.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
      message: error.message
    });
  }
});

// Get supported locales
router.get('/locales', async (req, res) => {
  try {
    const locales = await getAvailableLocales();

    res.json({
      success: true,
      locales,
      total: locales.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch locales',
      message: error.message
    });
  }
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    apiName: 'Invoice Generator API',
    version: '1.0.0',
    platform: 'Vercel Serverless',
    endpoints: {
      generateInvoice: {
        method: 'POST',
        path: '/api/generate-invoice',
        description: 'Generate a PDF invoice',
        requiredFields: [
          'invoiceNumber',
          'companyName',
          'productOrService',
          'taxPercent',
          'currency',
          'date'
        ],
        optionalFields: [
          'buyerCompany',
          'sellerCompany',
          'shippingAmount',
          'serviceFee',
          'dueDate',
          'companyLogo',
          'locale',
          'template'
        ],
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK'],
        supportedLocales: ['en', 'es', 'fr', 'de', 'nl', 'it', 'pt', 'sv', 'no', 'da'],
        templates: [1, 2, 3, 4, 5]
      }
    },
    examples: {
      minimal: {
        invoiceNumber: 'INV-001',
        companyName: 'Tech Corp',
        productOrService: [
          {
            name: 'Web Development',
            quantity: 1,
            price: 1500
          }
        ],
        taxPercent: 21,
        currency: 'USD',
        date: '2025-05-24'
      },
      complete: {
        invoiceNumber: 'INV-002',
        companyName: 'Tech Solutions Ltd',
        productOrService: [
          {
            name: 'Website Design',
            quantity: 1,
            price: 2000
          },
          {
            name: 'SEO Optimization',
            quantity: 3,
            price: 300
          }
        ],
        taxPercent: 21,
        currency: 'EUR',
        date: '2025-05-24',
        dueDate: '2025-06-24',
        locale: 'en',
        template: 2,
        buyerCompany: {
          name: 'Client Corp',
          address: '123 Business St, City, Country',
          taxNumber: 'TAX123456'
        },
        sellerCompany: {
          name: 'Tech Solutions Ltd',
          address: '456 Tech Ave, Innovation City',
          bankAccount: 'IBAN: DE89370400440532013000'
        },
        shippingAmount: 50,
        serviceFee: 25
      }
    }
  });
});

module.exports = router;