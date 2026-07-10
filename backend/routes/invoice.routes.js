const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const validate = require('../middleware/validate.middleware');
const { createInvoiceValidator, updateInvoiceStatusValidator } = require('../validators/invoice.validator');

const { protect, requirePermission } = require('../middleware/auth.middleware');

// Apply protection to all invoice routes
router.use(protect);

// --- List & Stats ---
router.get('/', requirePermission('invoices', 'read'), invoiceController.listInvoices);

// --- Individual Operations ---
router.get('/:id', requirePermission('invoices', 'read'), invoiceController.getInvoice);
router.get('/:id/pdf', requirePermission('invoices', 'read'), invoiceController.downloadPDF);

// --- Manual Creation & Updates ---
router.post('/', 
    requirePermission('invoices', 'write'),
    createInvoiceValidator,
    validate,
    invoiceController.createInvoice
);

router.put('/:id/status',
    requirePermission('invoices', 'write'),
    updateInvoiceStatusValidator,
    validate,
    invoiceController.updateStatus
);

router.put('/:id',
    requirePermission('invoices', 'write'),
    createInvoiceValidator,
    validate,
    invoiceController.updateInvoice
);

router.delete('/:id', requirePermission('invoices', 'delete'), invoiceController.deleteInvoice);

module.exports = router;
