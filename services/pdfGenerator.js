// PDF Generator for Vercel Serverless with proper HTML template rendering
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

console.log('PDF Generator loaded. Environment:', {
  VERCEL: process.env.VERCEL,
  NODE_ENV: process.env.NODE_ENV,
  isVercel: process.env.VERCEL === '1'
});

async function generatePDF(html, options = {}) {
  let browser = null;
  let page = null;

  try {
    console.log('Starting PDF generation with chrome-aws-lambda...');
    
    // Get Chromium executable path
    const executablePath = await chromium.executablePath;
    console.log('Chromium executable path:', executablePath);
    
    // Browser configuration for serverless
    const browserConfig = {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    };
    
    console.log('Launching browser with chrome-aws-lambda config');
    browser = await puppeteer.launch(browserConfig);
    console.log('Browser launched successfully');
    
    page = await browser.newPage();
    console.log('Page created');
    
    // Set viewport for better rendering
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2
    });
    
    console.log('Setting HTML content...');
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Add watermark if enabled
    if (process.env.ENABLE_WATERMARK === 'true' || options.watermark) {
      console.log('Adding watermark...');
      const watermarkHTML = `
        <div style="
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 48px;
          color: rgba(200, 200, 200, 0.3);
          font-family: Arial, sans-serif;
          font-weight: bold;
          z-index: 9999;
          pointer-events: none;
          white-space: nowrap;
        ">
          ${process.env.WATERMARK_TEXT || 'SAMPLE INVOICE'}
        </div>
      `;
      try {
        await page.evaluate((watermark) => {
          document.body.insertAdjacentHTML('beforeend', watermark);
        }, watermarkHTML);
      } catch (watermarkError) {
        console.warn('Failed to add watermark:', watermarkError.message);
      }
    }
    
    const pdfOptions = {
      format: options.format || 'A4',
      printBackground: true,
      margin: {
        top: options.marginTop || '0.5in',
        right: options.marginRight || '0.5in',
        bottom: options.marginBottom || '0.5in',
        left: options.marginLeft || '0.5in'
      },
      displayHeaderFooter: options.displayHeaderFooter || false,
      preferCSSPageSize: true
    };
    
    console.log('Generating PDF...');
    const pdfBuffer = await page.pdf(pdfOptions);
    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    return pdfBuffer;
    
  } catch (error) {
    console.error('PDF generation error:', error);
    console.error('Error stack:', error.stack);
    
    // Provide more specific error messages
    let errorMessage = error.message;
    if (error.message.includes('libnss3.so')) {
      errorMessage = 'System libraries missing. This is a Vercel environment issue.';
    } else if (error.message.includes('Failed to launch')) {
      errorMessage = 'Browser launch failed. Check executable path and permissions.';
    } else if (error.message.includes('Could not find Chrome')) {
      errorMessage = 'Chrome executable not found. This may be a serverless environment limitation.';
    }
    
    throw new Error(`Failed to generate PDF: ${errorMessage}`);
  } finally {
    // Cleanup
    if (page && !page.isClosed()) {
      try {
        await page.close();
        console.log('Page closed');
      } catch (closeError) {
        console.warn('Error closing page:', closeError.message);
      }
    }
    if (browser && browser.connected) {
      try {
        await browser.close();
        console.log('Browser closed');
      } catch (closeError) {
        console.warn('Error closing browser:', closeError.message);
      }
    }
  }
}

// Generate PDF with retry mechanism
const generatePDFWithRetry = async (html, options = {}, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`PDF generation attempt ${attempt}/${maxRetries}`);
      return await generatePDF(html, options);
    } catch (error) {
      lastError = error;
      console.warn(`PDF generation attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const waitTime = Math.min(Math.pow(2, attempt) * 1000, 5000);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
};

// Health check function
const healthCheck = async () => {
  try {
    console.log('Running health check...');
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Test Invoice</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .content { margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Test Invoice</h1>
          <p>Environment: ${process.env.VERCEL === '1' ? 'Vercel Serverless' : 'Local Development'}</p>
        </div>
        <div class="content">
          <h2>Test Content</h2>
          <p>This is a test invoice generated on ${new Date().toISOString()}</p>
          <p>If you can see this PDF with proper styling, the HTML template rendering is working correctly!</p>
        </div>
      </body>
      </html>
    `;
    await generatePDF(testHtml, { format: 'A4' });
    return { 
      status: 'healthy', 
      message: 'PDF generation is working correctly',
      environment: 'Vercel Serverless',
      method: 'chrome-aws-lambda with HTML templates'
    };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: error.message,
      environment: 'Vercel Serverless',
      method: 'chrome-aws-lambda with HTML templates'
    };
  }
};

module.exports = {
  generatePDF: generatePDFWithRetry,
  healthCheck
}; 