const http = require('http');

function testInvoiceGeneration() {
  const testData = {
    "invoiceNumber": "INV-001",
    "companyName": "Tech World",
    "productOrService": [
      {
        "description": "Web Development Services",
        "quantity": 1,
        "price": 1500
      },
      {
        "description": "UI/UX Design",
        "quantity": 2,
        "price": 500
      },
      {
        "description": "Server Maintenance",
        "quantity": 3,
        "price": 200
      }
    ],
    "taxPercent": 21,
    "currency": "USD",
    "date": "2025-05-25"
  };

  const postData = JSON.stringify(testData);

  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/generate-invoice',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('Testing invoice generation...');
  console.log('Request body:', JSON.stringify(testData, null, 2));

  const req = http.request(options, (res) => {
    console.log('Response status:', res.statusCode);
    console.log('Response headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('Response body:', JSON.stringify(result, null, 2));
      } catch (error) {
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error testing API:', error.message);
  });

  req.write(postData);
  req.end();
}

testInvoiceGeneration(); 