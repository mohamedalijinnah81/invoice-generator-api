const Joi = require('joi');

// Product/Service item schema
const productServiceSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required()
    .messages({
      'string.empty': 'Product/service name is required',
      'string.min': 'Product/service name must be at least 1 character',
      'string.max': 'Product/service name cannot exceed 200 characters'
    }),
  quantity: Joi.number().positive().precision(2).required()
    .messages({
      'number.positive': 'Quantity must be positive',
      'any.required': 'Quantity is required'
    }),
  price: Joi.number().positive().precision(2).required()
    .messages({
      'number.positive': 'Price must be positive',
      'any.required': 'Price is required'
    }),
  description: Joi.string().max(500).optional()
});

// Company information schema
const companySchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required()
    .messages({
      'string.empty': 'Company name is required',
      'string.max': 'Company name cannot exceed 200 characters'
    }),
  address: Joi.string().trim().max(500).optional(),
  taxNumber: Joi.string().trim().max(50).optional(),
  vatNumber: Joi.string().trim().max(50).optional(),
  bankAccount: Joi.string().trim().max(100).optional(),
  phone: Joi.string().trim().max(20).optional(),
  email: Joi.string().email().max(100).optional(),
  website: Joi.string().uri().max(200).optional()
});

// Main invoice data schema
const invoiceSchema = Joi.object({
  // Required fields
  invoiceNumber: Joi.string().trim().min(1).max(50).required()
    .messages({
      'string.empty': 'Invoice number is required',
      'string.max': 'Invoice number cannot exceed 50 characters'
    }),
  
  companyName: Joi.string().trim().min(1).max(200).required()
    .messages({
      'string.empty': 'Company name is required',
      'string.max': 'Company name cannot exceed 200 characters'
    }),
  
  productOrService: Joi.array().items(productServiceSchema).min(1).max(50).required()
    .messages({
      'array.min': 'At least one product or service is required',
      'array.max': 'Cannot exceed 50 items per invoice'
    }),
  
  taxPercent: Joi.number().min(0).max(100).precision(2).required()
    .messages({
      'number.min': 'Tax percent cannot be negative',
      'number.max': 'Tax percent cannot exceed 100%'
    }),
  
  currency: Joi.string().valid('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK').required()
    .messages({
      'any.only': 'Currency must be one of: USD, EUR, GBP, CAD, AUD, JPY, CHF, SEK, NOK, DKK'
    }),
  
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required()
    .messages({
      'string.pattern.base': 'Date must be in YYYY-MM-DD format'
    }),

  // Optional fields
  buyerCompany: companySchema.optional(),
  sellerCompany: companySchema.optional(),
  
  shippingAmount: Joi.number().min(0).precision(2).optional()
    .messages({
      'number.min': 'Shipping amount cannot be negative'
    }),
  
  serviceFee: Joi.number().min(0).precision(2).optional()
    .messages({
      'number.min': 'Service fee cannot be negative'
    }),
  
  discount: Joi.number().min(0).max(100).precision(2).optional()
    .messages({
      'number.min': 'Discount cannot be negative',
      'number.max': 'Discount cannot exceed 100%'
    }),
  
  dueDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional()
    .messages({
      'string.pattern.base': 'Due date must be in YYYY-MM-DD format'
    }),
  
  companyLogo: Joi.string().uri().max(500).optional()
    .messages({
      'string.uri': 'Company logo must be a valid URL'
    }),
  
  locale: Joi.string().valid('en', 'es', 'fr', 'de', 'nl', 'it', 'pt', 'sv', 'no', 'da').default('en')
    .messages({
      'any.only': 'Locale must be one of: en, es, fr, de, nl, it, pt, sv, no, da'
    }),
  
  template: Joi.number().integer().min(1).max(5).default(1)
    .messages({
      'number.min': 'Template must be between 1 and 5',
      'number.max': 'Template must be between 1 and 5'
    }),
  
  notes: Joi.string().max(1000).optional()
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters'
    }),
  
  paymentTerms: Joi.string().max(500).optional()
    .messages({
      'string.max': 'Payment terms cannot exceed 500 characters'
    }),
  
  // Watermark settings (for paid vs free tiers)
  watermark: Joi.boolean().default(false),
  
  // Additional customization
  theme: Joi.string().valid('light', 'dark', 'blue', 'green').default('light').optional(),
  
  // Custom fields for additional flexibility
  customFields: Joi.object().max(10).optional()
});

// Validation function
const validateInvoiceData = (data) => {
  const result = invoiceSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  // Additional custom validations
  if (!result.error && result.value) {
    const { date, dueDate } = result.value;
    
    // Validate that due date is not before invoice date
    if (dueDate && new Date(dueDate) < new Date(date)) {
      return {
        error: {
          details: [{
            message: 'Due date cannot be before invoice date',
            path: ['dueDate']
          }]
        }
      };
    }

    // Validate that date is not too far in the future
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
    if (new Date(date) > maxFutureDate) {
      return {
        error: {
          details: [{
            message: 'Invoice date cannot be more than 1 year in the future',
            path: ['date']
          }]
        }
      };
    }

    // Validate total amount doesn't exceed reasonable limits (prevent abuse)
    const subtotal = result.value.productOrService.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);
    
    if (subtotal > 1000000) { // $1M limit
      return {
        error: {
          details: [{
            message: 'Invoice total cannot exceed $1,000,000',
            path: ['productOrService']
          }]
        }
      };
    }
  }

  return result;
};

// Export validation functions
module.exports = {
  validateInvoiceData,
  invoiceSchema,
  productServiceSchema,
  companySchema
};