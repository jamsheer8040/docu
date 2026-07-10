const Invoice = require('../models/Invoice');
const InvoiceItem = require('../models/InvoiceItem');
const Customer = require('../models/Customer');
const WalletAccount = require('../models/WalletAccount');
const WalletTransaction = require('../models/WalletTransaction');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const { generateInvoicePDF } = require('../utils/pdfGenerator');

/**
 * Sequential Invoice Number Generator: INV-YYYY-XXXX
 */
const getNextInvoiceNumber = async () => {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    
    // Find the max invoice number for the current year
    const lastInvoice = await Invoice.findOne({
        where: {
            invoice_number: { [Op.like]: `${prefix}%` }
        },
        order: [['invoice_number', 'DESC']]
    });

    let nextNumber = 1;
    if (lastInvoice) {
        const lastSerial = parseInt(lastInvoice.invoice_number.split('-')[2]);
        nextNumber = lastSerial + 1;
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

/**
 * List all invoices
 */
exports.listInvoices = async (req, res) => {
    try {
        let { status, customer_id, date_from, date_to, search, page = 1, limit = 10 } = req.query;
        limit = Math.min(parseInt(limit), 100);
        const offset = (page - 1) * limit;

        const whereClause = {};
        
        if (status) whereClause.status = status;
        if (customer_id) whereClause.customer_id = customer_id;
        
        if (date_from || date_to) {
            whereClause.created_at = {};
            if (date_from) whereClause.created_at[Op.gte] = new Date(date_from);
            if (date_to) whereClause.created_at[Op.lte] = new Date(date_to);
        }

        const include = [
            { model: Customer, attributes: ['id', 'name', 'phone_whatsapp'] },
            { model: InvoiceItem }
        ];

        // Search logic (by invoice number or customer name)
        if (search) {
            whereClause[Op.or] = [
                { invoice_number: { [Op.like]: `%${search}%` } },
                { '$Customer.name$': { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Invoice.findAndCountAll({
            where: whereClause,
            include,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        res.json({ 
            success: true, 
            data: rows,
            meta: {
                total: count,
                page: parseInt(page),
                last_page: Math.ceil(count / limit)
            }
        });
    } catch (err) {
        console.error('List Invoices Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
    }
};

/**
 * Get Single Invoice with Items
 */
exports.getInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id, {
            include: [
                { model: Customer },
                { model: InvoiceItem }
            ]
        });

        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        res.json({ success: true, data: invoice });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch invoice' });
    }
};

/**
 * Create Manual Invoice
 */
exports.createInvoice = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { customer_id, service_order_id, items, discount, tax, due_date, notes, status } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Invoice must have at least one item' });
        }

        const invoiceNumber = await getNextInvoiceNumber();
        
        // Calculate Totals
        let subtotal = 0;
        let costTotal = 0;
        
        const invoice = await Invoice.create({
            invoice_number: invoiceNumber,
            customer_id,
            service_order_id: service_order_id || null,
            discount: discount || 0,
            tax: tax || 0,
            due_date,
            notes,
            status: status || 'Draft'
        }, { transaction });

        const itemRecords = items.map(item => {
            const itemTotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
            subtotal += itemTotal;
            costTotal += (parseFloat(item.quantity) * parseFloat(item.cost_price || 0));
            
            return {
                invoice_id: invoice.id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                cost_price: item.cost_price || 0,
                total: itemTotal
            };
        });

        await InvoiceItem.bulkCreate(itemRecords, { transaction });

        // Update main total
        const finalTotal = subtotal - (discount || 0) + (tax || 0);
        await invoice.update({ 
            subtotal, 
            total: finalTotal,
            cost_total: costTotal
        }, { transaction });

        // If service was waiting for an invoice (CompletedInvoicePending), promote it to CompletedInvoiceCreated
        if (service_order_id) {
            const ServiceOrder = require('../models/ServiceOrder');
            const order = await ServiceOrder.findByPk(service_order_id, { transaction });
            if (order && order.status === 'CompletedInvoicePending') {
                await order.update({
                    status: 'CompletedInvoiceCreated'
                }, { transaction });
            }
        }

        await transaction.commit();
        res.status(201).json({ success: true, data: invoice, message: `Invoice ${invoiceNumber} created` });
    } catch (err) {
        await transaction.rollback();
        console.error('Create Invoice Error:', err);
        res.status(500).json({ success: false, message: 'Failed to create invoice' });
    }
};

/**
 * Update Invoice
 */
exports.updateInvoice = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { customer_id, service_order_id, items, discount, tax, due_date, notes, status } = req.body;
        const invoice = await Invoice.findByPk(req.params.id, { transaction });

        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        if (invoice.status !== 'Draft') {
            return res.status(400).json({ success: false, message: 'Only Draft invoices can be edited' });
        }

        // Remove existing items
        await InvoiceItem.destroy({ where: { invoice_id: invoice.id }, transaction });

        // Calculate Totals
        let subtotal = 0;
        let costTotal = 0;

        const itemRecords = items.map(item => {
            const itemTotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
            subtotal += itemTotal;
            costTotal += (parseFloat(item.quantity) * parseFloat(item.cost_price || 0));
            
            return {
                invoice_id: invoice.id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                cost_price: item.cost_price || 0,
                total: itemTotal
            };
        });

        await InvoiceItem.bulkCreate(itemRecords, { transaction });

        // Update main total
        const finalTotal = subtotal - (parseFloat(discount) || 0) + (parseFloat(tax) || 0);
        await invoice.update({ 
            customer_id,
            service_order_id: service_order_id || null,
            discount: discount || 0,
            tax: tax || 0,
            due_date,
            notes,
            status: status || invoice.status,
            subtotal, 
            total: finalTotal,
            cost_total: costTotal
        }, { transaction });

        // If service was waiting for an invoice (CompletedInvoicePending), promote it to CompletedInvoiceCreated
        if (service_order_id) {
            const ServiceOrder = require('../models/ServiceOrder');
            const order = await ServiceOrder.findByPk(service_order_id, { transaction });
            if (order && order.status === 'CompletedInvoicePending') {
                await order.update({
                    status: 'CompletedInvoiceCreated'
                }, { transaction });
            }
        }

        await transaction.commit();
        res.json({ success: true, data: invoice, message: 'Invoice updated successfully' });
    } catch (err) {
        await transaction.rollback();
        console.error('Update Invoice Error:', err);
        res.status(500).json({ success: false, message: 'Failed to update invoice' });
    }
};

/**
 * Update Status & Wallet Integration
 */
exports.updateStatus = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { status, account_id, amount } = req.body; 
        const invoice = await Invoice.findByPk(req.params.id, { transaction });

        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        
        // Transition Logic: Adding Payment (Moving TO Paid or Partially Paid)
        if ((status === 'Paid' || status === 'Partially Paid') && (invoice.status !== 'Paid' || status === 'Partially Paid')) {
            if (!account_id) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Please select a Wallet Account to receive funds' });
            }

            const paymentAmount = parseFloat(amount) || (parseFloat(invoice.total) - parseFloat(invoice.paid_amount));
            
            if (paymentAmount <= 0) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Invalid payment amount' });
            }

            await WalletTransaction.create({
                account_id,
                type: 'Income',
                direction: 'In',
                amount: paymentAmount,
                reference_id: invoice.id,
                reference_type: 'Invoice',
                description: `Payment for Invoice #${invoice.invoice_number}`
            }, { transaction });

            await WalletAccount.increment('balance', { 
                by: paymentAmount, 
                where: { id: account_id }, 
                transaction 
            });

            const newPaidAmount = parseFloat(invoice.paid_amount) + paymentAmount;
            const finalStatus = newPaidAmount >= parseFloat(invoice.total) ? 'Paid' : 'Partially Paid';

            await invoice.update({ 
                status: finalStatus, 
                paid_amount: newPaidAmount,
                paid_at: finalStatus === 'Paid' ? new Date() : invoice.paid_at 
            }, { transaction });
        } 
        // Transition Logic: Full Reversal (Moving to Draft/Cancelled)
        else if ((status === 'Draft' || status === 'Cancelled') && (invoice.status === 'Paid' || invoice.status === 'Partially Paid')) {
            // Find ALL transactions for this invoice
            const transactions = await WalletTransaction.findAll({
                where: { reference_id: invoice.id, reference_type: 'Invoice', type: 'Income' },
                transaction
            });

            for (const tx of transactions) {
                await WalletAccount.decrement('balance', {
                    by: tx.amount,
                    where: { id: tx.account_id },
                    transaction
                });
                await tx.destroy({ transaction });
            }

            await invoice.update({ status, paid_amount: 0, paid_at: null }, { transaction });
        }
        // General Status Change
        else {
            await invoice.update({ status }, { transaction });
        }

        await transaction.commit();
        res.json({ success: true, message: `Invoice status updated to ${status}` });
    } catch (err) {
        await transaction.rollback();
        console.error('Update Status Error:', err);
        res.status(500).json({ success: false, message: 'Failed to update status', error: err.message });
    }
};

/**
 * Delete Invoice (Draft only)
 */
exports.deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id);
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        
        if (invoice.status !== 'Draft') {
            return res.status(400).json({ success: false, message: 'Only Draft invoices can be deleted' });
        }

        await invoice.destroy();
        res.json({ success: true, message: 'Invoice deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete invoice' });
    }
};

/**
 * Generate PDF
 */
exports.downloadPDF = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id, {
            include: [
                { model: Customer },
                { model: InvoiceItem }
            ]
        });

        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.invoice_number}.pdf`);

        await generateInvoicePDF(invoice, res);
    } catch (err) {
        console.error('PDF Generation Error:', err);
        res.status(500).json({ success: false, message: 'Failed to generate PDF' });
    }
};
