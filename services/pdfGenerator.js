const isServerless = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

async function generatePDF(html, options = {}) {
  let puppeteer;
  let browser;
  let page;

  try {
    let browserConfig = {
      headless: 'new',
      ignoreHTTPSErrors: true,
      timeout: parseInt(process.env.PDF_TIMEOUT || '30000'),
      protocolTimeout: parseInt(process.env.PDF_TIMEOUT || '30000')
    };

    if (isServerless) {
      puppeteer = require('puppeteer-core');
      const chromium = require('@sparticuz/chromium');
      browserConfig = {
        ...browserConfig,
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless
      };
    } else {
      puppeteer = require('puppeteer');
      // No executablePath needed for local puppeteer
    }

    browser = await puppeteer.launch(browserConfig);
    page = await browser.newPage();

    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2
    });

    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: parseInt(process.env.PDF_TIMEOUT || '30000')
    });

    await page.waitForTimeout(1000);

    // Add watermark if enabled
    if (process.env.ENABLE_WATERMARK === 'true' || options.watermark) {
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
      preferCSSPageSize: true,
      timeout: parseInt(process.env.PDF_TIMEOUT || '30000')
    };

    const pdfBuffer = await page.pdf(pdfOptions);
    return pdfBuffer;

  } catch (error) {
    console.error('PDF generation error:', error);
    let errorMessage = error.message;
    if (error.message.includes('Protocol error')) {
      errorMessage = 'Browser protocol error occurred. This may be due to environment constraints.';
    } else if (error.message.includes('Target closed')) {
      errorMessage = 'Browser target was closed unexpectedly during PDF generation.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'PDF generation timed out. Please try again with simpler content.';
    } else if (error.message.includes('ENOENT')) {
      errorMessage = 'Browser executable not found. Please ensure Chrome/Chromium is installed.';
    }
    throw new Error(`Failed to generate PDF: ${errorMessage}`);
  } finally {
    if (page && !page.isClosed()) {
      try { await page.close(); } catch (closeError) {}
    }
    if (browser && browser.connected) {
      try { await browser.close(); } catch (closeError) {}
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
        // Shorter wait time for serverless
        const waitTime = Math.min(Math.pow(2, attempt) * 500, 2000);
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
    // Test PDF generation with minimal content
    const testHtml = '<html><body><h1>Test</h1></body></html>';
    await generatePDF(testHtml, { format: 'A4' });
    return { 
      status: 'healthy', 
      message: 'PDF generation is working correctly' 
    };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: error.message 
    };
  }
};

module.exports = {
  generatePDF: generatePDFWithRetry,
  healthCheck
};