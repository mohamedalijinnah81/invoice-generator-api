// PDF Generator for Vercel Serverless using full Puppeteer
const puppeteer = require('puppeteer');

console.log('PDF Generator loaded. Environment:', {
  VERCEL: process.env.VERCEL,
  NODE_ENV: process.env.NODE_ENV,
  isVercel: process.env.VERCEL === '1'
});

async function generatePDF(html, options = {}) {
  let browser = null;
  let page = null;

  try {
    console.log('Starting PDF generation...');
    
    // Browser configuration optimized for serverless
    const browserConfig = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection'
      ],
      ignoreHTTPSErrors: true,
      timeout: 30000
    };
    
    console.log('Launching browser with serverless-optimized config');
    browser = await puppeteer.launch(browserConfig);
    console.log('Browser launched successfully');
    
    page = await browser.newPage();
    console.log('Page created');
    
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2
    });
    
    console.log('Setting HTML content...');
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    await page.waitForTimeout(1000);
    
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
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      displayHeaderFooter: false,
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
const generatePDFWithRetry = async (html, options = {}, maxRetries = 2) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`PDF generation attempt ${attempt}/${maxRetries}`);
      return await generatePDF(html, options);
    } catch (error) {
      lastError = error;
      console.warn(`PDF generation attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        const waitTime = Math.min(Math.pow(2, attempt) * 1000, 3000);
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
    const testHtml = '<html><body><h1>Test</h1></body></html>';
    await generatePDF(testHtml, { format: 'A4' });
    return { 
      status: 'healthy', 
      message: 'PDF generation is working correctly',
      environment: 'Vercel Serverless'
    };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: error.message,
      environment: 'Vercel Serverless'
    };
  }
};

module.exports = {
  generatePDF: generatePDFWithRetry,
  healthCheck
};