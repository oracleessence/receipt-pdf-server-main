require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Root endpoint for health check
app.get('/', (req, res) => {
    res.status(200).send('<h1>PDF Generation Server is running!</h1><p>Send a POST request to /webhook to generate a PDF.</p>');
});

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || '';
const PDF_DIR = path.join(__dirname, 'pdfs');
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR);
}

// Middleware to check for API key
const authenticateKey = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer <token>"

    if (token == null) {
        return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }
    if (token !== API_KEY) {
        return res.status(403).json({ error: 'Forbidden: Invalid token.' });
    }
    next();
};

// Helper to get a value from a nested object using dot notation
const get = (obj, path, defaultValue = undefined) => {
  const travel = (regexp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
};


// Applies the mapping to transform the incoming payload
function applyMapping(payload, mapping) {
  const mappedData = { ...payload };
  
  const mappableFields = [
    'companyName', 'companyAddress', 'companyPhone', 'companyEmail',
    'receiptNumber', 'date', 'customerName', 'customerAddress', 
    'customerEmail', 'paymentMethod', 'tax', 'discount'
  ];

  mappableFields.forEach(field => {
    if (mapping[field]) {
      mappedData[field] = get(payload, mapping[field]);
    }
  });

  // Handle the products array separately
  if (mapping.products && mapping.productsMap) {
    const sourceArray = get(payload, mapping.products);
    if (Array.isArray(sourceArray)) {
      mappedData.products = sourceArray.map(item => {
        const mappedItem = {};
        for (const [targetKey, sourceKey] of Object.entries(mapping.productsMap)) {
          mappedItem[targetKey] = get(item, sourceKey);
        }
        return mappedItem;
      });
    }
  }

  return mappedData;
}


// Flexible PDF generation function
function generateReceiptPdf(data, jsPDF) {
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const FONT = data.config?.font || 'Helvetica', PRIMARY_COLOR = data.config?.primaryColor || '#60A5FA', SECONDARY_COLOR = data.config?.secondaryColor || '#6B7280', TEXT_COLOR = data.config?.textColor || '#111827', SUBTLE_TEXT_COLOR = '#4B5563';
    const pageWidth = doc.internal.pageSize.getWidth(), margin = 40; let y = 50;
    doc.setFont(FONT, 'bold'); doc.setFontSize(18); doc.setTextColor(TEXT_COLOR); doc.text(data.companyName || 'Your Company LLC', margin, y); y += 20;
    doc.setFont(FONT, 'normal'); doc.setFontSize(10); doc.setTextColor(SUBTLE_TEXT_COLOR);
    const companyAddressLines = doc.splitTextToSize(data.companyAddress || '123 Business Rd.\\nSuite 100\\nCity, State 12345', 200);
    doc.text(companyAddressLines, margin, y); y += companyAddressLines.length * 12 + 10;
    doc.text(data.companyPhone || '(123) 456-7890', margin, y); y += 12; doc.text(data.companyEmail || 'contact@yourcompany.com', margin, y);
    let rightX = pageWidth - margin, rightY = 50;
    doc.setFont(FONT, 'bold'); doc.setFontSize(26); doc.setTextColor(TEXT_COLOR); doc.text(data.title || 'RECEIPT', rightX, rightY, { align: 'right' }); rightY += 35;
    doc.setFont(FONT, 'normal'); doc.setFontSize(10); doc.setTextColor(TEXT_COLOR);
    doc.text(`${data.receiptNumberLabel || 'Receipt #:'} ${data.receiptNumber || 'N/A'}`, rightX, rightY, { align: 'right' }); rightY += 15;
    doc.text(`${data.dateLabel || 'Date:'} ${data.date || 'N/A'}`, rightX, rightY, { align: 'right' });
    y = Math.max(y, rightY) + 40;
    doc.setDrawColor(PRIMARY_COLOR); doc.setLineWidth(1.5); doc.line(margin, y, pageWidth - margin, y); y += 30;
    const billedToY = y; doc.setFont(FONT, 'bold'); doc.setFontSize(10); doc.setTextColor(SUBTLE_TEXT_COLOR); doc.text(data.invoiceToLabel || 'BILLED TO', margin, y); y += 15;
    doc.setFont(FONT, 'normal'); doc.setFontSize(12); doc.setTextColor(TEXT_COLOR); doc.text(data.customerName || 'N/A', margin, y); y += 15;
    doc.setFontSize(10); doc.setTextColor(SECONDARY_COLOR);
    const addressLines = doc.splitTextToSize(data.customerAddress || '', 250); doc.text(addressLines, margin, y); y += addressLines.length * 12 + 5; doc.text(data.customerEmail || '', margin, y);
    const paymentMethodX = rightX - 200; doc.setFont(FONT, 'bold'); doc.setFontSize(10); doc.setTextColor(SUBTLE_TEXT_COLOR); doc.text(data.paymentMethodLabel || 'PAYMENT METHOD', paymentMethodX, billedToY);
    doc.setFont(FONT, 'normal'); doc.setFontSize(12); doc.setTextColor(TEXT_COLOR); doc.text(data.paymentMethod || 'N/A', paymentMethodX, billedToY + 15); y += 40;
    doc.setFillColor('#F3F4F6'); doc.rect(margin, y, pageWidth - (margin * 2), 25, 'F'); y += 17;
    doc.setFont(FONT, 'bold'); doc.setFontSize(10); doc.setTextColor(TEXT_COLOR);
    const productX = margin + 15, quantityX = 380, unitPriceX = 450, amountX = pageWidth - margin - 15;
    doc.text(data.productColumnHeader || 'ITEM DESCRIPTION', productX, y); doc.text(data.quantityColumnHeader || 'QTY', quantityX, y, { align: 'right' }); doc.text(data.unitPriceColumnHeader || 'UNIT PRICE', unitPriceX, y, { align: 'right' }); doc.text(data.amountColumnHeader || 'TOTAL', amountX, y, { align: 'right' }); y += 15;
    doc.setDrawColor(SECONDARY_COLOR); doc.setLineWidth(0.5); doc.line(margin, y, pageWidth - margin, y); y += 15;
    doc.setFont(FONT, 'normal'); doc.setFontSize(10); doc.setTextColor(TEXT_COLOR); let subtotal = 0;
    if (data.products && Array.isArray(data.products)) {
        data.products.forEach(product => {
            const amount = (product.quantity || 0) * (product.unitPrice || 0); subtotal += amount;
            const productNameLines = doc.splitTextToSize(product.name || 'N/A', 250);
            const rowHeight = Math.max(productNameLines.length * 12, 12) + 10;
            if (y + rowHeight > doc.internal.pageSize.getHeight() - 150) { doc.addPage(); y = margin; }
            doc.text(productNameLines, productX, y); doc.text(String(product.quantity || 0), quantityX, y, { align: 'right' }); doc.text(String(product.unitPrice?.toFixed(2) || '0.00'), unitPriceX, y, { align: 'right' }); doc.text(String(amount.toFixed(2)), amountX, y, { align: 'right' });
            y += rowHeight; doc.setDrawColor('#E5E7EB'); doc.line(margin, y - 5, pageWidth - margin, y - 5);
        });
    }
    y += 20;
    const totalSectionX = pageWidth - margin - 200;
    doc.setFontSize(10); doc.setTextColor(SECONDARY_COLOR); doc.text(data.subtotalLabel || 'Subtotal', totalSectionX, y); doc.text(subtotal.toFixed(2), amountX, y, { align: 'right' }); y += 20;
    const tax = data.tax || 0; if (tax > 0) { doc.text(data.taxLabel || 'Tax', totalSectionX, y); doc.text(tax.toFixed(2), amountX, y, { align: 'right' }); y += 20; }
    const discount = data.discount || 0; if (discount > 0) { doc.text(data.discountLabel || 'Discount', totalSectionX, y); doc.text(`-${discount.toFixed(2)}`, amountX, y, { align: 'right' }); y += 20; }
    const grandTotal = subtotal + tax - discount;
    doc.setFillColor(PRIMARY_COLOR); doc.rect(totalSectionX - 20, y, 200 + 20 + 15, 35, 'F'); y += 23;
    doc.setFont(FONT, 'bold'); doc.setFontSize(14); doc.setTextColor('#FFFFFF');
    doc.text(data.totalLabel || 'TOTAL', totalSectionX - 10, y); doc.text(grandTotal.toFixed(2), amountX, y, { align: 'right' });
    return Buffer.from(doc.output('arraybuffer'));
}

// Secure the webhook endpoint with the authentication middleware
app.post('/webhook', authenticateKey, (req, res) => {
  try {
    const { payload, mapping } = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Invalid or missing "payload" object.' });
    }
    
    // If a mapping is provided, apply it. Otherwise, use the payload directly.
    const dataForPdf = mapping ? applyMapping(payload, mapping) : payload;
    
    const pdfBuffer = generateReceiptPdf(dataForPdf, jsPDF);
    const filename = `receipt_${Date.now()}.pdf`;
    const filePath = path.join(PDF_DIR, filename);

    fs.writeFileSync(filePath, pdfBuffer);
    
    const fileUrl = `${req.protocol}://${req.get('host')}/pdfs/${filename}`;
    console.log(`PDF created: ${fileUrl}`);

    // Optionally, send the result to another webhook (e.g., Make.com)
    if (MAKE_WEBHOOK_URL) {
      axios.post(MAKE_WEBHOOK_URL, {
        pdfUrl: fileUrl,
        originalPayload: payload,
      }).catch(err => {
        console.error('Error sending to secondary webhook:', err.message);
      });
    }

    res.status(200).json({ message: 'PDF created successfully', url: fileUrl });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF.' });
  }
});

app.use('/pdfs', express.static(PDF_DIR));

app.listen(PORT, () => {
    if (!API_KEY) {
        console.warn('⚠️ WARNING: API_KEY is not set in your .env file. The /webhook endpoint will be unsecured.');
    }
  console.log(`✅ PDF Webhook Server is running on http://localhost:${PORT}`);
});
