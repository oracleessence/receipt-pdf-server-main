import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import JsonInputArea from './components/JsonInputArea';
import PdfPreview from './components/PdfPreview';
import Loader from './components/Loader';
import AutomationGuide from './components/AutomationGuide';
import { DownloadIcon } from './components/icons/DownloadIcon';
import ApiKeyDisplay from './components/ApiKeyDisplay';
import WebhookMapper from './components/WebhookMapper';

// This lets TypeScript know that jsPDF is available globally from the CDN in index.html
declare const jspdf: any;

// This function can be used in both frontend (App.tsx) and backend (server/index.js)
// It's designed to be flexible, reading styles and labels from the data object.
const generateReceiptPdf = (data: any, jsPDF: any) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4'
    });

    // --- CONFIGURATION & DEFAULTS ---
    const FONT = data.config?.font || 'Helvetica';
    const PRIMARY_COLOR = data.config?.primaryColor || '#60A5FA';
    const SECONDARY_COLOR = data.config?.secondaryColor || '#6B7280';
    const TEXT_COLOR = data.config?.textColor || '#111827';
    const SUBTLE_TEXT_COLOR = '#4B5563';

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = 50;

    // --- HEADER: Company Info & Receipt Details ---
    // Company Info (Left)
    doc.setFont(FONT, 'bold');
    doc.setFontSize(18);
    doc.setTextColor(TEXT_COLOR);
    doc.text(data.companyName || 'Your Company LLC', margin, y);
    y += 20;

    doc.setFont(FONT, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(SUBTLE_TEXT_COLOR);
    const companyAddressLines = doc.splitTextToSize(data.companyAddress || '123 Business Rd.\nSuite 100\nCity, State 12345', 200);
    doc.text(companyAddressLines, margin, y);
    y += companyAddressLines.length * 12 + 10;
    doc.text(data.companyPhone || '(123) 456-7890', margin, y);
    y += 12;
    doc.text(data.companyEmail || 'contact@yourcompany.com', margin, y);


    // Receipt Details (Right)
    let rightX = pageWidth - margin;
    let rightY = 50;
    doc.setFont(FONT, 'bold');
    doc.setFontSize(26);
    doc.setTextColor(TEXT_COLOR);
    doc.text(data.title || 'RECEIPT', rightX, rightY, { align: 'right' });
    rightY += 35;

    doc.setFont(FONT, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(TEXT_COLOR);
    doc.text(`${data.receiptNumberLabel || 'Receipt #:'} ${data.receiptNumber || 'N/A'}`, rightX, rightY, { align: 'right' });
    rightY += 15;
    doc.text(`${data.dateLabel || 'Date:'} ${data.date || 'N/A'}`, rightX, rightY, { align: 'right' });
    
    // Set y to be below both left and right columns
    y = Math.max(y, rightY) + 40;


    // --- SEPARATOR ---
    doc.setDrawColor(PRIMARY_COLOR);
    doc.setLineWidth(1.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 30;


    // --- BILLED TO & PAYMENT METHOD ---
    const billedToY = y;
    doc.setFont(FONT, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(SUBTLE_TEXT_COLOR);
    doc.text(data.invoiceToLabel || 'BILLED TO', margin, y);
    y += 15;
    
    doc.setFont(FONT, 'normal');
    doc.setFontSize(12);
    doc.setTextColor(TEXT_COLOR);
    doc.text(data.customerName || 'N/A', margin, y);
    y += 15;

    doc.setFontSize(10);
    doc.setTextColor(SECONDARY_COLOR);
    const addressLines = doc.splitTextToSize(data.customerAddress || '', 250);
    doc.text(addressLines, margin, y);
    y += addressLines.length * 12 + 5;
    doc.text(data.customerEmail || '', margin, y);

    // Payment Method (Right column, aligned with Billed To)
    const paymentMethodX = rightX - 200;
    doc.setFont(FONT, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(SUBTLE_TEXT_COLOR);
    doc.text(data.paymentMethodLabel || 'PAYMENT METHOD', paymentMethodX, billedToY);
    
    doc.setFont(FONT, 'normal');
    doc.setFontSize(12);
    doc.setTextColor(TEXT_COLOR);
    doc.text(data.paymentMethod || 'N/A', paymentMethodX, billedToY + 15);

    y += 40;

    // --- PRODUCTS TABLE HEADER ---
    doc.setFillColor('#F3F4F6'); // Light gray background
    doc.rect(margin, y, pageWidth - (margin * 2), 25, 'F');
    y += 17;

    doc.setFont(FONT, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(TEXT_COLOR);
    
    const productX = margin + 15;
    const quantityX = 380;
    const unitPriceX = 450;
    const amountX = pageWidth - margin - 15;

    doc.text(data.productColumnHeader || 'ITEM DESCRIPTION', productX, y);
    doc.text(data.quantityColumnHeader || 'QTY', quantityX, y, { align: 'right' });
    doc.text(data.unitPriceColumnHeader || 'UNIT PRICE', unitPriceX, y, { align: 'right' });
    doc.text(data.amountColumnHeader || 'TOTAL', amountX, y, { align: 'right' });
    y += 15;
    
    // Line under header
    doc.setDrawColor(SECONDARY_COLOR);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 15;

    
    // --- PRODUCTS TABLE ROWS ---
    doc.setFont(FONT, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(TEXT_COLOR);
    let subtotal = 0;

    if (data.products && Array.isArray(data.products)) {
        data.products.forEach((product: any) => {
            const amount = (product.quantity || 0) * (product.unitPrice || 0);
            subtotal += amount;

            const productNameLines = doc.splitTextToSize(product.name || 'N/A', 250);
            const productLineHeight = productNameLines.length * 12;
            const rowHeight = Math.max(productLineHeight, 12) + 10;
            
            // Check for page break
            if (y + rowHeight > doc.internal.pageSize.getHeight() - 150) {
                doc.addPage();
                y = margin;
            }

            doc.text(productNameLines, productX, y);
            doc.text(String(product.quantity || 0), quantityX, y, { align: 'right' });
            doc.text(String(product.unitPrice?.toFixed(2) || '0.00'), unitPriceX, y, { align: 'right' });
            doc.text(String(amount.toFixed(2)), amountX, y, { align: 'right' });
            
            y += rowHeight;
            doc.setDrawColor('#E5E7EB');
            doc.line(margin, y - 5, pageWidth - margin, y-5);
        });
    }

    y += 20;

    // --- TOTALS ---
    const totalSectionX = pageWidth - margin - 200;

    doc.setFontSize(10);
    doc.setTextColor(SECONDARY_COLOR);
    doc.text(data.subtotalLabel || 'Subtotal', totalSectionX, y);
    doc.text(subtotal.toFixed(2), amountX, y, { align: 'right' });
    y += 20;

    const tax = data.tax || 0;
    if (tax > 0) {
        doc.text(data.taxLabel || `Tax`, totalSectionX, y);
        doc.text(tax.toFixed(2), amountX, y, { align: 'right' });
        y += 20;
    }

    const discount = data.discount || 0;
    if (discount > 0) {
        doc.text(data.discountLabel || 'Discount', totalSectionX, y);
        doc.text(`-${discount.toFixed(2)}`, amountX, y, { align: 'right' });
        y += 20;
    }
    
    const grandTotal = subtotal + tax - discount;

    doc.setFillColor(PRIMARY_COLOR);
    doc.rect(totalSectionX - 20, y, 200 + 20 + 15, 35, 'F');
    y += 23;
    
    doc.setFont(FONT, 'bold');
    doc.setFontSize(14);
    doc.setTextColor('#FFFFFF');
    doc.text(data.totalLabel || 'TOTAL', totalSectionX - 10, y);
    doc.text(grandTotal.toFixed(2), amountX, y, { align: 'right' });
    
    return doc;
};


const App: React.FC = () => {
    const [jsonInput, setJsonInput] = useState<string>(`{
  "config": {
    "primaryColor": "#60A5FA",
    "secondaryColor": "#6B7280",
    "textColor": "#1F2937",
    "font": "Helvetica"
  },
  "title": "RECEIPT",
  "companyName": "Innovate Inc.",
  "companyAddress": "123 Tech Avenue, Silicon Valley, CA 94043",
  "companyPhone": "+1 (555) 123-4567",
  "companyEmail": "billing@innovate.com",
  "receiptNumberLabel": "Receipt #",
  "receiptNumber": "INV-2024-00123",
  "dateLabel": "Date Issued",
  "date": "August 23, 2024",
  "invoiceToLabel": "BILLED TO",
  "customerName": "Alex Chen",
  "customerAddress": "987 Pine Avenue, Lakeview\\nSan Francisco, CA, 94102",
  "customerEmail": "alex.chen@example.com",
  "paymentMethodLabel": "PAID VIA",
  "paymentMethod": "Credit Card (**** 4242)",
  "productColumnHeader": "Item Description",
  "quantityColumnHeader": "Qty.",
  "unitPriceColumnHeader": "Unit Price",
  "amountColumnHeader": "Total",
  "products": [
    { "name": "Pro Wireless Keyboard", "quantity": 1, "unitPrice": 129.99 },
    { "name": "Ergonomic Mouse", "quantity": 1, "unitPrice": 79.50 },
    { "name": "4K UHD Monitor with Extended Warranty", "quantity": 1, "unitPrice": 499.00 }
  ],
  "subtotalLabel": "Subtotal",
  "taxLabel": "Sales Tax (8.25%)",
  "tax": 58.92,
  "discountLabel": "Discount",
  "discount": 0,
  "totalLabel": "GRAND TOTAL"
}`);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string>('');
    const [mapping, setMapping] = useState({
        companyName: 'companyName',
        companyAddress: 'companyAddress',
        companyPhone: 'companyPhone',
        companyEmail: 'companyEmail',
        receiptNumber: 'receiptNumber',
        date: 'date',
        customerName: 'customerName',
        customerAddress: 'customerAddress',
        customerEmail: 'customerEmail',
        paymentMethod: 'paymentMethod',
        products: 'products',
        productsMap: {
            name: 'name',
            quantity: 'quantity',
            unitPrice: 'unitPrice'
        },
        tax: 'tax',
        discount: 'discount'
    });

    useEffect(() => {
        // Generate a random API key on initial component mount
        const generateApiKey = () => {
            const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let result = 'fc';
            for (let i = 0; i < 28; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return result;
        };
        setApiKey(generateApiKey());
    }, []);


    const handleGeneratePdf = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setPdfUrl(null);

        // Use a timeout to allow the UI to update
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const data = JSON.parse(jsonInput);
            const { jsPDF } = jspdf;
            
            const doc = generateReceiptPdf(data, jsPDF);
            
            const pdfOutputUrl = doc.output('datauristring');
            setPdfUrl(pdfOutputUrl);

        } catch (e) {
            if (e instanceof SyntaxError) {
                setError('Invalid JSON format. Please check your input.');
            } else {
                setError('An unexpected error occurred during PDF generation.');
                console.error(e);
            }
        } finally {
            setIsLoading(false);
        }
    }, [jsonInput]);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Header />
                <main className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col space-y-4">
                        <JsonInputArea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            error={error}
                        />
                        <button
                            onClick={handleGeneratePdf}
                            disabled={isLoading || !jsonInput.trim()}
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            {isLoading ? (
                                <>
                                    <Loader />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <DownloadIcon className="h-5 w-5 mr-2" />
                                    Generate PDF
                                </>
                            )}
                        </button>
                    </div>
                    <div className="flex flex-col">
                         <PdfPreview pdfUrl={pdfUrl} isLoading={isLoading} />
                    </div>
                </main>
                <WebhookMapper mapping={mapping} setMapping={setMapping} />
                <ApiKeyDisplay apiKey={apiKey} />
                <AutomationGuide apiKey={apiKey} mapping={mapping} />
            </div>
        </div>
    );
};

export default App;
