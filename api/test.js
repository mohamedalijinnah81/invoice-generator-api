const { generatePDF } = require('../services/pdfGenerator');

module.exports = async (req, res) => {
  try {
    console.log('Test endpoint called');
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Environment info
    const envInfo = {
      VERCEL: process.env.VERCEL,
      NODE_ENV: process.env.NODE_ENV,
      isVercel: process.env.VERCEL === '1',
      timestamp: new Date().toISOString()
    };
    
    console.log('Environment info:', envInfo);
    
    // Test PDF generation
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Test PDF</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .content { margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PDF Generation Test</h1>
          <p>Environment: ${envInfo.isVercel ? 'Vercel Serverless' : 'Local Development'}</p>
        </div>
        
        <div class="content">
          <h2>Test Content</h2>
          <p>This is a test PDF generated on ${envInfo.timestamp}</p>
          <p>If you can see this PDF, the PDF generation is working correctly!</p>
        </div>
      </body>
      </html>
    `;
    
    console.log('Generating test PDF...');
    const pdfBuffer = await generatePDF(testHtml, { format: 'A4' });
    console.log('Test PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    
    // Return success response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="test.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(200).send(pdfBuffer);
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    
    res.status(500).json({
      error: 'Test failed',
      message: error.message,
      environment: {
        VERCEL: process.env.VERCEL,
        NODE_ENV: process.env.NODE_ENV,
        isVercel: process.env.VERCEL === '1'
      },
      timestamp: new Date().toISOString()
    });
  }
}; 