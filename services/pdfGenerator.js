const puppeteer = require('puppeteer');

let browser;
let isInitializing = false;

// Initialize browser instance with better error handling
const initBrowser = async () => {
  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    // Wait for current initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return browser;
  }

  if (!browser || !browser.connected) {
    isInitializing = true;
    
    try {
      // Close existing browser if it exists but is disconnected
      if (browser) {
        try {
          await browser.close();
        } catch (error) {
          console.warn('Error closing disconnected browser:', error.message);
        }
        browser = null;
      }

      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-extensions'
        ],
        timeout: parseInt(process.env.PDF_TIMEOUT || '60000'),
        protocolTimeout: parseInt(process.env.PDF_TIMEOUT || '60000')
      });

      // Add error handlers to browser
      browser.on('disconnected', () => {
        console.warn('Browser disconnected');
        browser = null;
      });

      browser.on('targetdestroyed', (target) => {
        console.warn('Browser target destroyed:', target.url());
      });

    } catch (error) {
      console.error('Failed to initialize browser:', error);
      browser = null;
      throw error;
    } finally {
      isInitializing = false;
    }
  }
  
  return browser;
};

// Generate PDF from HTML with improved error handling
const generatePDF = async (html, options = {}) => {
  let page = null;
  
  try {
    const browserInstance = await initBrowser();
    
    if (!browserInstance || !browserInstance.connected) {
      throw new Error('Browser instance is not available or disconnected');
    }

    // Create new page with error handling
    page = await browserInstance.newPage();

    // Set up page error handlers
    page.on('error', (error) => {
      console.error('Page error:', error);
    });

    page.on('pageerror', (error) => {
      console.error('Page script error:', error);
    });

    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2
    });

    // Set longer timeouts for content loading
    const timeout = parseInt(process.env.PDF_TIMEOUT || '60000');
    page.setDefaultTimeout(timeout);
    page.setDefaultNavigationTimeout(timeout);

    // Set content with multiple fallback strategies
    try {
      await page.setContent(html, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: timeout
      });
    } catch (contentError) {
      console.warn('Failed with networkidle0, trying networkidle2:', contentError.message);
      try {
        await page.setContent(html, {
          waitUntil: ['networkidle2', 'domcontentloaded'],
          timeout: timeout
        });
      } catch (fallbackError) {
        console.warn('Failed with networkidle2, trying domcontentloaded only:', fallbackError.message);
        await page.setContent(html, {
          waitUntil: 'domcontentloaded',
          timeout: timeout
        });
      }
    }

    // Wait a bit more to ensure everything is rendered
    await page.waitForTimeout(1000);

    // Check if page is still connected
    if (page.isClosed()) {
      throw new Error('Page was closed unexpectedly');
    }

    // PDF generation options
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
      headerTemplate: options.headerTemplate || '',
      footerTemplate: options.footerTemplate || '',
      preferCSSPageSize: true,
      timeout: timeout
    };

    // Add watermark for free tier if needed
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

    // Generate PDF buffer with error handling
    const pdfBuffer = await page.pdf(pdfOptions);
    
    return pdfBuffer;

  } catch (error) {
    console.error('PDF generation error:', error);
    
    // Enhanced error messages for common issues
    let errorMessage = error.message;
    if (error.message.includes('Navigating frame was detached')) {
      errorMessage = 'Browser frame was detached during PDF generation. This usually indicates a resource issue.';
    } else if (error.message.includes('Protocol error')) {
      errorMessage = 'Browser protocol error occurred. The browser instance may be unstable.';
    } else if (error.message.includes('Target closed')) {
      errorMessage = 'Browser target was closed unexpectedly during PDF generation.';
    }
    
    throw new Error(`Failed to generate PDF: ${errorMessage}`);
  } finally {
    // Ensure page is properly closed
    if (page && !page.isClosed()) {
      try {
        await page.close();
      } catch (closeError) {
        console.warn('Error closing page:', closeError.message);
      }
    }
  }
};

// Generate PDF with enhanced retry mechanism
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
        // Progressive wait time (exponential backoff)
        const waitTime = Math.min(Math.pow(2, attempt) * 1000, 10000);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Force browser restart on certain errors
        if (error.message.includes('detached') || 
            error.message.includes('Protocol error') || 
            error.message.includes('Target closed') ||
            error.message.includes('disconnected')) {
          
          console.log('Forcing browser restart due to critical error...');
          await forceCleanup();
        }
      }
    }
  }
  
  throw lastError;
};

// Force cleanup of browser resources
const forceCleanup = async () => {
  if (browser) {
    try {
      // Get all pages and close them
      const pages = await browser.pages();
      await Promise.all(pages.map(page => {
        if (!page.isClosed()) {
          return page.close().catch(err => console.warn('Error closing page:', err.message));
        }
      }));
      
      // Close browser
      await browser.close();
    } catch (error) {
      console.warn('Error during force cleanup:', error.message);
    }
    
    browser = null;
  }
  
  // Reset initialization flag
  isInitializing = false;
};

// Regular cleanup function
const cleanup = async () => {
  console.log('Cleaning up PDF generator...');
  await forceCleanup();
};

// Enhanced graceful shutdown
const setupGracefulShutdown = () => {
  const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
  
  signals.forEach(signal => {
    process.on(signal, async () => {
      console.log(`Received ${signal}, cleaning up...`);
      await cleanup();
      process.exit(0);
    });
  });

  process.on('exit', () => {
    console.log('Process exiting...');
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught exception:', error);
    await cleanup();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    await cleanup();
    process.exit(1);
  });
};

// Initialize graceful shutdown
setupGracefulShutdown();

// Health check function
const healthCheck = async () => {
  try {
    if (!browser || !browser.connected) {
      return { status: 'unhealthy', message: 'Browser not available' };
    }
    
    const pages = await browser.pages();
    return { 
      status: 'healthy', 
      message: `Browser connected with ${pages.length} pages` 
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
  cleanup,
  forceCleanup,
  healthCheck
};