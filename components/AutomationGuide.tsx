import React, { useState } from 'react';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CodeBracketIcon } from './icons/CodeBracketIcon';

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
    const [isCopied, setIsCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    return (
        <div className="relative mt-4">
            <pre className="p-4 bg-gray-900 rounded-md text-sm text-gray-300 overflow-x-auto font-mono">
                <code>{code}</code>
            </pre>
            <button
                onClick={handleCopy}
                className="absolute top-3 right-3 inline-flex items-center px-3 py-1.5 border border-gray-600 text-xs font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors"
            >
                <ClipboardIcon className="h-4 w-4 mr-2" />
                {isCopied ? 'Copied!' : 'Copy Code'}
            </button>
        </div>
    );
};

interface Mapping {
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    companyEmail: string;
    receiptNumber: string;
    date: string;
    customerName: string;
    customerAddress: string;
    customerEmail: string;
    paymentMethod: string;
    products: string;
    productsMap: {
        name: string;
        quantity: string;
        unitPrice: string;
    },
    tax: string,
    discount: string
}

const AutomationGuide: React.FC<{ mapping: Mapping }> = ({ mapping }) => {
    const packageJsonCode = `{
  "name": "receipt-pdf-server",
  "version": "1.0.0",
  "description": "A webhook server to generate styled PDFs from JSON.",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jspdf": "^2.5.1"
  }
}`;

    const indexJsCode = `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { jsPDF } = require('jspdf');
const path = require('path');

const app = express();
app.use(cors());

// Increase flexibility by accepting both JSON and URL-encoded bodies
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Custom error handler for bad JSON to provide a clearer error message
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Bad JSON received:', err.message);
    return res.status(400).json({ error: 'Malformed JSON in request body. Please ensure your webhook is sending valid JSON.' });
  }
  next(err);
});

const PORT = process.env.PORT || 3000;

const get = (obj, path, defaultValue = undefined) => {
  const travel = (regexp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
  const result = travel(/[,[\\]]+?/) || travel(/[,[\\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
};

function applyMapping(payload, mapping) {
  const mappedData = { ...payload }; 
  const mappableFields = [
    'companyName', 'companyAddress', 'companyPhone', 'companyEmail',
    'receiptNumber', 'date', 'customerName', 'customerAddress', 
    'customerEmail', 'paymentMethod', 'tax', 'discount'
  ];
  mappableFields.forEach(field => {
    if (mapping[field]) mappedData[field] = get(payload, mapping[field]);
  });

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
    doc.text(\`\${data.receiptNumberLabel || 'Receipt #:'} \${data.receiptNumber || 'N/A'}\`, rightX, rightY, { align: 'right' }); rightY += 15;
    doc.text(\`\${data.dateLabel || 'Date:'} \${data.date || 'N/A'}\`, rightX, rightY, { align: 'right' });
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
    const discount = data.discount || 0; if (discount > 0) { doc.text(data.discountLabel || 'Discount', totalSectionX, y); doc.text(\`-\${discount.toFixed(2)}\`, amountX, y, { align: 'right' }); y += 20; }
    const grandTotal = subtotal + tax - discount;
    doc.setFillColor(PRIMARY_COLOR); doc.rect(totalSectionX - 20, y, 200 + 20 + 15, 35, 'F'); y += 23;
    doc.setFont(FONT, 'bold'); doc.setFontSize(14); doc.setTextColor('#FFFFFF');
    doc.text(data.totalLabel || 'TOTAL', totalSectionX - 10, y); doc.text(grandTotal.toFixed(2), amountX, y, { align: 'right' });
    return Buffer.from(doc.output('arraybuffer'));
}

// --- API ROUTES ---
app.post('/', (req, res) => {
  try {
    const { mapping } = req.body;
    let payload;

    // Handle both nested { "payload": {...} } and flat request bodies
    if (req.body.payload && typeof req.body.payload === 'object') {
      payload = req.body.payload;
    } else {
      payload = { ...req.body };
      if (payload.mapping) {
        delete payload.mapping;
      }
    }

    if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'Invalid or missing \\"payload\\" object.' });
    }
    
    const dataForPdf = mapping ? applyMapping(payload, mapping) : payload;
    const pdfBuffer = generateReceiptPdf(dataForPdf, jsPDF);

    const filename = \`receipt_\${Date.now()}.pdf\`;
    
    // Send the PDF file directly in the response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', \`attachment; filename="\${filename}"\`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF.' });
  }
});

// --- FRONTEND SERVING ---
const FRONTEND_DIR = path.join(__dirname, '..');
app.use(express.static(FRONTEND_DIR));
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.listen(PORT, () => {
    console.log(\`✅ PDF Webhook Server is running on http://localhost:\${PORT}\`);
});`;

    const dotEnvCode = `# Optional: Port for the server to run on. Defaults to 3000.
# PORT=3000`;

    // A helper to build a sample object from a dot-notation path
    const buildObjectFromPath = (path: string, value: any, obj: any = {}) => {
        if (!path) return;
        const keys = path.split('.');
        let current = obj;
        keys.forEach((key, index) => {
            if (index === keys.length - 1) {
                current[key] = value;
            } else {
                current[key] = current[key] || {};
                current = current[key];
            }
        });
        return obj;
    };
    
    // Generate a dynamic sample payload based on the mapping
    const generateSamplePayload = () => {
        let payload: any = {};
        const simpleFields = {
            [mapping.companyName]: 'Innovate Inc.',
            [mapping.companyAddress]: '123 Tech Avenue, Silicon Valley, CA 94043',
            [mapping.companyPhone]: '+1 (555) 123-4567',
            [mapping.companyEmail]: 'billing@innovate.com',
            [mapping.receiptNumber]: 'INV-2024-00123',
            [mapping.date]: 'August 23, 2024',
            [mapping.customerName]: 'Alex Chen',
            [mapping.customerAddress]: '987 Pine Avenue, Lakeview\\nSan Francisco, CA, 94102',
            [mapping.customerEmail]: 'alex.chen@example.com',
            [mapping.paymentMethod]: 'Credit Card (**** 4242)',
            [mapping.tax]: 58.92,
            [mapping.discount]: 0,
        };
        for (const [path, value] of Object.entries(simpleFields)) {
            buildObjectFromPath(path, value, payload);
        }

        let productExample: any = {};
        buildObjectFromPath(mapping.productsMap.name, 'Pro Wireless Keyboard', productExample);
        buildObjectFromPath(mapping.productsMap.quantity, 1, productExample);
        buildObjectFromPath(mapping.productsMap.unitPrice, 129.99, productExample);

        buildObjectFromPath(mapping.products, [productExample], payload);

        // Add config for styling
        payload.config = {
            "primaryColor": "#60A5FA",
            "font": "Helvetica"
        };
        payload.title = "RECEIPT";
        
        return payload;
    };

    const curlCode = `curl -X POST https://receipt-pdf-server-main.onrender.com/ \\
-H "Content-Type: application/json" \\
-d '{
  "mapping": ${JSON.stringify(mapping, null, 2)},
  "payload": ${JSON.stringify(generateSamplePayload(), null, 2)}
}' \\
--output receipt.pdf`;

    return (
        <section className="mt-8 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
            <h2 className="flex items-center text-2xl font-bold text-gray-100">
                <CodeBracketIcon className="h-7 w-7 mr-3 text-indigo-400" />
                Webhook Server & Automation Guide
            </h2>
            <p className="mt-2 text-gray-400">
                Follow these steps to set up a dedicated Node.js server that listens for webhook requests, maps your custom data structure, and generates a styled PDF.
            </p>

            <div className="mt-6 space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-indigo-300">Step 1: Create Your Project Folder</h3>
                    <p className="mt-2 text-sm text-gray-400">Create a new folder for your server and navigate into it.</p>
                    <CodeBlock code="mkdir my-pdf-server && cd my-pdf-server" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-indigo-300">Step 2: Create a <code className="text-sm bg-gray-900 p-1 rounded">package.json</code> File</h3>
                    <p className="mt-2 text-sm text-gray-400">This file defines your project and its dependencies.</p>
                    <CodeBlock code={packageJsonCode} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-indigo-300">Step 3: Install Dependencies</h3>
                    <p className="mt-2 text-sm text-gray-400">Run this command to install the required packages.</p>
                    <CodeBlock code="npm install" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-indigo-300">Step 4: Create the Server File <code className="text-sm bg-gray-900 p-1 rounded">index.js</code></h3>
                    <p className="mt-2 text-sm text-gray-400">This is the core of your server. It handles requests, maps data, and returns the generated PDF file directly.</p>
                    <CodeBlock code={indexJsCode} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-indigo-300">Step 5: Create a <code className="text-sm bg-gray-900 p-1 rounded">.env</code> File (Optional)</h3>
                    <p className="mt-2 text-sm text-gray-400">Create this file in your project folder if you need to configure a custom port.</p>
                    <CodeBlock code={dotEnvCode} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-indigo-300">Step 6: Deploy & Run Your Server</h3>
                    <p className="mt-2 text-sm text-gray-400">Run <code className="text-xs bg-gray-900 p-1 rounded">npm start</code> to run the server locally. For online access, deploy it to a service like Render. Once deployed, it's live and ready for requests!</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-indigo-300">Step 7: Send a Test Request to Your Live Server</h3>
                    <p className="mt-2 text-sm text-gray-400">Use this cURL command in a new terminal to send a test request. It includes your current field mappings and will save the resulting PDF as <code className="text-xs bg-gray-900 p-1 rounded">receipt.pdf</code> in your current directory.</p>
                    <CodeBlock code={curlCode} />
                </div>
            </div>
        </section>
    );
};

export default AutomationGuide;