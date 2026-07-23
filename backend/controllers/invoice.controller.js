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

        // Restrict CustomerPortal users to only their linked customers
        if (req.user && req.user.Role && req.user.Role.type === 'CustomerPortal') {
            const linkedIds = req.user.LinkedCustomers ? req.user.LinkedCustomers.map(c => c.id) : [];
            whereClause.customer_id = { [Op.in]: linkedIds };
        }
        
        if (date_from || date_to) {
            whereClause.created_at = {};
            if (date_from) whereClause.created_at[Op.gte] = new Date(date_from);
            if (date_to) {
                const endDate = new Date(date_to);
                endDate.setHours(23, 59, 59, 999);
                whereClause.created_at[Op.lte] = endDate;
            }
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
            const listPrice = parseFloat(item.list_price || 0);
            const costPrice = parseFloat(item.cost_price || 0);
            const serviceCharge = parseFloat(item.service_charge || 0);
            const sellingPrice = parseFloat(item.selling_price || (costPrice + serviceCharge));
            const vatPercentage = parseFloat(item.vat_percentage || 0);
            const vatAmount = parseFloat(item.vat_amount || 0);
            const quantity = parseFloat(item.quantity || 1);
            
            const itemTotal = parseFloat(item.total || 0) || (sellingPrice + vatAmount) * quantity;
            const unitPrice = parseFloat(item.unit_price || 0) || (sellingPrice + vatAmount);

            subtotal += itemTotal;
            costTotal += (quantity * costPrice);
            
            return {
                invoice_id: invoice.id,
                description: item.description,
                quantity: quantity,
                list_price: listPrice,
                cost_price: costPrice,
                service_charge: serviceCharge,
                selling_price: sellingPrice,
                vat_percentage: vatPercentage,
                vat_amount: vatAmount,
                unit_price: unitPrice,
                total: itemTotal,
                wallet_id: item.wallet_id || null,
                tenant_id: req.tenantId
            };
        });

        await InvoiceItem.bulkCreate(itemRecords, { transaction });

        if (invoice.status === 'Issued') {
            const { WalletTransaction, WalletAccount } = require('../models');
            for (const item of itemRecords) {
                if (item.wallet_id && item.cost_price > 0) {
                    const totalCost = parseFloat(item.cost_price) * parseInt(item.quantity);
                    if (totalCost > 0) {
                        await WalletTransaction.create({
                            account_id: item.wallet_id,
                            type: 'Expense',
                            direction: 'Out',
                            amount: totalCost,
                            reference_id: invoice.id,
                            reference_type: 'InvoiceCost',
                            description: `Cost payment for Invoice #${invoice.invoice_number} - ${item.description}`,
                            tenant_id: invoice.tenant_id
                        }, { transaction });
                        await WalletAccount.decrement('balance', {
                            by: totalCost,
                            where: { id: item.wallet_id },
                            transaction
                        });
                    }
                }
            }
        }

        // Update main total
        const finalTotal = subtotal - (parseFloat(discount) || 0); // Note: overall tax field is separate, but we use item vat too. We'll leave global tax as is for now if they use it.
        await invoice.update({ 
            subtotal, 
            total: finalTotal + (parseFloat(tax) || 0),
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

                // Sync status to SalesOrderItem
                const SalesOrderItem = require('../models/SalesOrderItem');
                const salesOrderItem = await SalesOrderItem.findOne({
                    where: { service_order_id: order.id },
                    transaction
                });
                if (salesOrderItem) {
                    await salesOrderItem.update({ status: 'CompletedInvoiceCreated' }, { transaction });
                }
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
        if (invoice.status !== 'Draft' && invoice.status !== 'Pending Approval') {
            return res.status(400).json({ success: false, message: 'Only Draft/Pending invoices can be edited' });
        }

        // Remove existing items
        await InvoiceItem.destroy({ where: { invoice_id: invoice.id }, transaction });

        // Calculate Totals
        let subtotal = 0;
        let costTotal = 0;

        const itemRecords = items.map(item => {
            const listPrice = parseFloat(item.list_price || 0);
            const costPrice = parseFloat(item.cost_price || 0);
            const serviceCharge = parseFloat(item.service_charge || 0);
            const sellingPrice = parseFloat(item.selling_price || (costPrice + serviceCharge));
            const vatPercentage = parseFloat(item.vat_percentage || 0);
            const vatAmount = parseFloat(item.vat_amount || 0);
            const quantity = parseFloat(item.quantity || 1);
            
            const itemTotal = parseFloat(item.total || 0) || (sellingPrice + vatAmount) * quantity;
            const unitPrice = parseFloat(item.unit_price || 0) || (sellingPrice + vatAmount);

            subtotal += itemTotal;
            costTotal += (quantity * costPrice);
            
            return {
                invoice_id: invoice.id,
                description: item.description,
                quantity: quantity,
                list_price: listPrice,
                cost_price: costPrice,
                service_charge: serviceCharge,
                selling_price: sellingPrice,
                vat_percentage: vatPercentage,
                vat_amount: vatAmount,
                unit_price: unitPrice,
                total: itemTotal,
                wallet_id: item.wallet_id || null,
                tenant_id: req.tenantId
            };
        });

        await InvoiceItem.bulkCreate(itemRecords, { transaction });

        if (invoice.status === 'Issued') {
            const { WalletTransaction, WalletAccount } = require('../models');
            for (const item of itemRecords) {
                if (item.wallet_id && item.cost_price > 0) {
                    const totalCost = parseFloat(item.cost_price) * parseInt(item.quantity);
                    if (totalCost > 0) {
                        await WalletTransaction.create({
                            account_id: item.wallet_id,
                            type: 'Expense',
                            direction: 'Out',
                            amount: totalCost,
                            reference_id: invoice.id,
                            reference_type: 'InvoiceCost',
                            description: `Cost payment for Invoice #${invoice.invoice_number} - ${item.description}`,
                            tenant_id: invoice.tenant_id
                        }, { transaction });
                        await WalletAccount.decrement('balance', {
                            by: totalCost,
                            where: { id: item.wallet_id },
                            transaction
                        });
                    }
                }
            }
        }

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

                // Sync status to SalesOrderItem
                const SalesOrderItem = require('../models/SalesOrderItem');
                const salesOrderItem = await SalesOrderItem.findOne({
                    where: { service_order_id: order.id },
                    transaction
                });
                if (salesOrderItem) {
                    await salesOrderItem.update({ status: 'CompletedInvoiceCreated' }, { transaction });
                }
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
        const invoice = await Invoice.findByPk(req.params.id, { 
            include: [{ model: InvoiceItem }],
            transaction 
        });

        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
        
        // 1. Wallet Deduction Logic for Government Fees (Cost Price)
        // Happens when an invoice transitions to Issued for the first time
        if (status === 'Issued' && invoice.status !== 'Issued' && invoice.status !== 'Paid' && invoice.status !== 'Partially Paid') {
            for (const item of invoice.InvoiceItems) {
                if (item.wallet_id && item.cost_price > 0) {
                    const totalCost = parseFloat(item.cost_price) * parseInt(item.quantity);
                    if (totalCost > 0) {
                        // Create negative WalletTransaction (Expense)
                        await WalletTransaction.create({
                            account_id: item.wallet_id,
                            type: 'Expense',
                            direction: 'Out',
                            amount: totalCost,
                            reference_id: invoice.id,
                            reference_type: 'InvoiceCost',
                            description: `Cost payment for Invoice #${invoice.invoice_number} - ${item.description}`,
                            tenant_id: invoice.tenant_id
                        }, { transaction });

                        // Deduct from wallet balance
                        await WalletAccount.decrement('balance', {
                            by: totalCost,
                            where: { id: item.wallet_id },
                            transaction
                        });
                    }
                }
            }
        }

        // Transition Logic: Reversing Issued -> Draft/Cancelled
        if ((status === 'Draft' || status === 'Cancelled' || status === 'Pending Approval') && 
            (invoice.status === 'Issued' || invoice.status === 'Paid' || invoice.status === 'Partially Paid')) {
            // Find ALL cost transactions for this invoice
            const costTransactions = await WalletTransaction.findAll({
                where: { reference_id: invoice.id, reference_type: 'InvoiceCost', type: 'Expense' },
                transaction
            });

            for (const tx of costTransactions) {
                // Revert deduction (Add back to balance)
                await WalletAccount.increment('balance', {
                    by: tx.amount,
                    where: { id: tx.account_id },
                    transaction
                });
                await tx.destroy({ transaction });
            }
        }

        // 2. Income Logic for Payments
        // Transition Logic: Adding Payment (Moving TO Paid or Partially Paid)
        if ((status === 'Paid' || status === 'Partially Paid') && (invoice.status !== 'Paid' || status === 'Partially Paid')) {
            if (!account_id && invoice.status !== 'Issued' && invoice.status !== 'Approved' && invoice.status !== 'Draft') {
                // If it's just transitioning to Paid from Draft without setting account_id, we should block if amount > 0 and no account.
                // But actually, we need an account to receive money.
                if (!account_id) {
                    await transaction.rollback();
                    return res.status(400).json({ success: false, message: 'Please select a Wallet Account to receive funds' });
                }
            }

            if (account_id) {
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
                    description: `Payment for Invoice #${invoice.invoice_number}`,
                    tenant_id: invoice.tenant_id
                }, { transaction });

                await WalletAccount.increment('balance', { 
                    by: paymentAmount, 
                    where: { id: account_id }, 
                    transaction 
                });

                const newPaidAmount = parseFloat(invoice.paid_amount) + paymentAmount;
                const finalStatus = newPaidAmount >= parseFloat(invoice.total) ? 'Paid' : 'Partially Paid';
                const finalPaymentStatus = newPaidAmount >= parseFloat(invoice.total) ? 'Paid' : 'Partial';

                await invoice.update({ 
                    status: finalStatus,
                    payment_status: finalPaymentStatus,
                    paid_amount: newPaidAmount,
                    paid_at: finalStatus === 'Paid' ? new Date() : invoice.paid_at 
                }, { transaction });
            } else {
                await invoice.update({ status }, { transaction });
            }
        } 
        // Transition Logic: Full Reversal of Payments (Moving to Draft/Cancelled)
        else if ((status === 'Draft' || status === 'Cancelled') && (invoice.status === 'Paid' || invoice.status === 'Partially Paid')) {
            // Find ALL income transactions for this invoice
            const incomeTransactions = await WalletTransaction.findAll({
                where: { reference_id: invoice.id, reference_type: 'Invoice', type: 'Income' },
                transaction
            });

            for (const tx of incomeTransactions) {
                await WalletAccount.decrement('balance', {
                    by: tx.amount,
                    where: { id: tx.account_id },
                    transaction
                });
                await tx.destroy({ transaction });
            }

            await invoice.update({ status, payment_status: 'Unpaid', paid_amount: 0, paid_at: null }, { transaction });
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
        
        if (invoice.status !== 'Draft' && invoice.status !== 'Pending Approval') {
            return res.status(400).json({ success: false, message: 'Only Draft/Pending invoices can be deleted' });
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
