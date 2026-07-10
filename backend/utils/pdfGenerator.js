const PDFDocument = require('pdfkit');

/**
 * Generate PDF using pdfkit
 */
exports.generateInvoicePDF = (invoice, res) => {
    const doc = new PDFDocument({ margin: 50 });

    // Stream the PDF to the response
    doc.pipe(res);

    // --- Header ---
    doc.fillColor('#444444')
       .fontSize(24)
       .text('DocClear Management System', 50, 50)
       .fontSize(10)
       .text('Building A-1, Business Bay', 50, 80)
       .text('Dubai, UAE', 50, 95)
       .text('Phone: +971 4 000 0000', 50, 110)
       .moveDown();

    // --- Invoice Info ---
    doc.fillColor('#000000')
       .fontSize(20)
       .text('INVOICE', 50, 160);

    doc.fontSize(10)
       .text(`Invoice Number: ${invoice.invoice_number}`, 400, 160)
       .text(`Invoice Date: ${new Date(invoice.createdAt).toLocaleDateString('en-GB')}`, 400, 175)
       .text(`Due Date: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-GB') : 'N/A'}`, 400, 190)
       .moveDown();

    // --- Customer Info ---
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Bill To:', 50, 220);
    
    doc.font('Helvetica')
       .fontSize(10)
       .text(invoice.Customer?.name || 'Customer Name', 50, 235)
       .text(invoice.Customer?.email || 'Email: N/A', 50, 250)
       .text(invoice.Customer?.phone_whatsapp || 'Phone: N/A', 50, 265);

    // --- Table Header ---
    const tableTop = 330;
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .text('Description', 50, tableTop)
       .text('Qty', 300, tableTop)
       .text('Unit Price', 350, tableTop, { width: 90, align: 'right' })
       .text('Total', 450, tableTop, { width: 90, align: 'right' });

    doc.moveTo(50, tableTop + 15)
       .lineTo(550, tableTop + 15)
       .stroke();

    // --- Table Rows ---
    let position = tableTop + 30;
    doc.font('Helvetica');

    invoice.InvoiceItems.forEach(item => {
        doc.fontSize(10)
           .text(item.description, 50, position)
           .text(item.quantity.toString(), 300, position)
           .text(`${parseFloat(item.unit_price).toFixed(2)}`, 350, position, { width: 90, align: 'right' })
           .text(`${parseFloat(item.total).toFixed(2)}`, 450, position, { width: 90, align: 'right' });

        position += 20;
    });

    // --- Totals ---
    const subtotalPosition = position + 30;
    doc.moveTo(350, subtotalPosition - 10)
       .lineTo(550, subtotalPosition - 10)
       .stroke();

    doc.fontSize(10)
       .text('Subtotal:', 350, subtotalPosition, { width: 90, align: 'right' })
       .text(`${parseFloat(invoice.subtotal).toFixed(2)}`, 450, subtotalPosition, { width: 90, align: 'right' });

    if (invoice.discount > 0) {
        doc.text('Discount:', 350, subtotalPosition + 20, { width: 90, align: 'right' })
           .text(`-${parseFloat(invoice.discount).toFixed(2)}`, 450, subtotalPosition + 20, { width: 90, align: 'right' });
    }

    if (invoice.tax > 0) {
        doc.text('Tax:', 350, subtotalPosition + 40, { width: 90, align: 'right' })
           .text(`${parseFloat(invoice.tax).toFixed(2)}`, 450, subtotalPosition + 40, { width: 90, align: 'right' });
    }

    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor('#0B57D0')
       .text('Total (AED):', 340, subtotalPosition + 60, { width: 100, align: 'right' })
       .text(`${parseFloat(invoice.total).toFixed(2)}`, 450, subtotalPosition + 60, { width: 90, align: 'right' });

    // --- Footer ---
    doc.fillColor('#aaaaaa')
       .fontSize(10)
       .text('Thank you for your business. Payment is due within 15 days.', 50, 700, { align: 'center', width: 500 });

    doc.end();
};
