// PDF Generator for Traditional Node.js Server (Render) with Fallback
const puppeteer = require('puppeteer');

console.log('PDF Generator loaded. Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  RENDER: process.env.RENDER,
  isRender: process.env.RENDER === 'true',
  PUPPETEER_CACHE_DIR: process.env.PUPPETEER_CACHE_DIR
});

async function generatePDFWithPuppeteer(html, options = {}) {
  let browser = null;
  let page = null;

  try {
    console.log('Starting PDF generation with Puppeteer...');
    
    // Browser configuration for traditional server deployment
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
        '--disable-ipc-flooding-protection',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      ignoreHTTPSErrors: true,
      timeout: 30000
    };
    
    // Try to find Chrome executable path
    try {
      const { execSync } = require('child_process');
      const chromePath = execSync('which google-chrome', { encoding: 'utf8' }).trim();
      console.log('Found Chrome at:', chromePath);
      browserConfig.executablePath = chromePath;
    } catch (chromeError) {
      console.log('Chrome not found in PATH, using default Puppeteer Chrome');
      // Let Puppeteer use its bundled Chrome
    }
    
    console.log('Launching browser with traditional server config');
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
    console.error('Puppeteer PDF generation failed:', error.message);
    throw error;
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

async function generatePDFWithFallback(html, options = {}) {
  try {
    console.log('Trying fallback PDF generation...');
    const fallbackGenerator = require('./pdfGeneratorFallback');
    return await fallbackGenerator.generatePDF(html, options);
  } catch (fallbackError) {
    console.error('Fallback PDF generation also failed:', fallbackError.message);
    throw new Error(`All PDF generation methods failed. Puppeteer and fallback both failed.`);
  }
}

async function generatePDF(html, options = {}) {
  try {
    // Try Puppeteer first
    return await generatePDFWithPuppeteer(html, options);
  } catch (puppeteerError) {
    console.log('Puppeteer failed, trying fallback method...');
    return await generatePDFWithFallback(html, options);
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
          <p>Environment: ${process.env.RENDER === 'true' ? 'Render Server' : 'Local Development'}</p>
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
      environment: 'Render Server',
      method: 'Puppeteer with fallback'
    };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: error.message,
      environment: 'Render Server',
      method: 'Puppeteer with fallback'
    };
  }
};

module.exports = {
  generatePDF: generatePDFWithRetry,
  healthCheck
}; 