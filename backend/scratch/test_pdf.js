const { Invoice, InvoiceItem, Customer } = require('../models');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const fs = require('fs');

async function testPdf() {
  try {
    const invoice = await Invoice.findOne({
      include: [
        { model: Customer },
        { model: InvoiceItem }
      ]
    });

    if (!invoice) {
        console.log('No invoice found to test.');
        process.exit(0);
    }

    console.log('Invoice found:', invoice.invoice_number);
    console.log('Processing items:', invoice.InvoiceItems?.length || 0);

    const writeStream = fs.createWriteStream('./scratch/test_invoice.pdf');
    
    // Mock response object
    const res = writeStream;
    res.setHeader = (n, v) => console.log(`Header: ${n}=${v}`);

    generateInvoicePDF(invoice, res);

    writeStream.on('finish', () => {
      console.log('PDF generated successfully at ./scratch/test_invoice.pdf');
      process.exit(0);
    });
  } catch (error) {
    console.error('PDF Test Failed:', error);
    process.exit(1);
  }
}

testPdf();
