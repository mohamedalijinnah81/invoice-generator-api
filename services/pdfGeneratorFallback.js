// Fallback PDF Generator using html-pdf-node
const htmlPdf = require('html-pdf-node');

console.log('Fallback PDF Generator loaded');

async function generatePDF(html, options = {}) {
  try {
    console.log('Starting PDF generation with html-pdf-node fallback...');
    
    const pdfOptions = {
      format: options.format || 'A4',
      margin: {
        top: options.marginTop || '0.5in',
        right: options.marginRight || '0.5in',
        bottom: options.marginBottom || '0.5in',
        left: options.marginLeft || '0.5in'
      },
      printBackground: true,
      preferCSSPageSize: true
    };
    
    const file = { content: html };
    const pdfBuffer = await htmlPdf.generatePdf(file, pdfOptions);
    
    console.log('Fallback PDF generated successfully, size:', pdfBuffer.length, 'bytes');
    return pdfBuffer;
    
  } catch (error) {
    console.error('Fallback PDF generation error:', error);
    throw new Error(`Fallback PDF generation failed: ${error.message}`);
  }
}

module.exports = { generatePDF }; 