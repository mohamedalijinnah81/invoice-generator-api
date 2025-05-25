const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Upload PDF buffer to Cloudinary
const uploadToCloudinary = async (pdfBuffer, invoiceNumber) => {
  try {
    // Validate configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary configuration is missing. Please check your environment variables.');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueId = uuidv4().substring(0, 8);
    const fileName = `invoice_${invoiceNumber}_${timestamp}_${uniqueId}`;

    // Upload options
    const uploadOptions = {
      resource_type: 'raw',
      public_id: `invoices/${fileName}`,
      folder: 'invoices',
      format: 'pdf',
      tags: ['invoice', 'pdf', invoiceNumber],
      context: {
        invoice_number: invoiceNumber,
        generated_at: new Date().toISOString(),
        file_type: 'invoice_pdf'
      },
      // Set expiration for temporary files (optional)
      // expires_at: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
    };

    // Convert buffer to base64 data URL
    const base64PDF = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64PDF, uploadOptions);

    return {
      success: true,
      secure_url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      format: result.format,
      bytes: result.bytes,
      url: result.url,
      created_at: result.created_at,
      version: result.version
    };

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    
    // Handle specific Cloudinary errors
    if (error.error && error.error.message) {
      throw new Error(`Cloudinary upload failed: ${error.error.message}`);
    }
    
    throw new Error(`Failed to upload PDF to cloud storage: ${error.message}`);
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw'
    });
    
    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete file from cloud storage: ${error.message}`);
  }
};

// Get file info from Cloudinary
const getFileInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'raw'
    });
    
    return result;
  } catch (error) {
    console.error('Cloudinary get file info error:', error);
    throw new Error(`Failed to get file info: ${error.message}`);
  }
};

// List all invoice files
const listInvoices = async (options = {}) => {
  try {
    const result = await cloudinary.api.resources({
      resource_type: 'raw',
      type: 'upload',
      prefix: 'invoices/',
      max_results: options.limit || 50,
      next_cursor: options.cursor,
      tags: ['invoice']
    });
    
    return {
      resources: result.resources,
      next_cursor: result.next_cursor,
      total_count: result.total_count
    };
  } catch (error) {
    console.error('Cloudinary list invoices error:', error);
    throw new Error(`Failed to list invoices: ${error.message}`);
  }
};

// Generate signed URL for temporary access
const generateSignedUrl = async (publicId, options = {}) => {
  try {
    const signedUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
      resource_type: 'raw',
      expires_at: options.expiresAt || Math.floor(Date.now() / 1000) + 3600, // 1 hour default
      attachment: options.attachment || false
    });
    
    return signedUrl;
  } catch (error) {
    console.error('Cloudinary signed URL error:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

// Cleanup old files (helper function for maintenance)
const cleanupOldFiles = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await cloudinary.api.resources({
      resource_type: 'raw',
      type: 'upload',
      prefix: 'invoices/',
      max_results: 500
    });
    
    const oldFiles = result.resources.filter(resource => {
      const createdAt = new Date(resource.created_at);
      return createdAt < cutoffDate;
    });
    
    const deletePromises = oldFiles.map(file => 
      deleteFromCloudinary(file.public_id).catch(error => {
        console.warn(`Failed to delete ${file.public_id}:`, error.message);
        return null;
      })
    );
    
    await Promise.all(deletePromises);
    
    return {
      deleted: oldFiles.length,
      cutoffDate: cutoffDate.toISOString()
    };
  } catch (error) {
    console.error('Cleanup error:', error);
    throw new Error(`Failed to cleanup old files: ${error.message}`);
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getFileInfo,
  listInvoices,
  generateSignedUrl,
  cleanupOldFiles
};