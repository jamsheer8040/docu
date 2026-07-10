const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense.controller');
const { createExpenseValidator, updateExpenseValidator, markPaidValidator } = require('../validators/expense.validators');
const validate = require('../middleware/validate.middleware.js');

const { protect, requirePermission } = require('../middleware/auth.middleware');

// Apply protection to all expense routes
router.use(protect);

// --- List & Stats ---
router.get('/', requirePermission('expenses', 'read'), expenseController.listExpenses);

// --- Individual Operations ---
router.get('/:id', requirePermission('expenses', 'read'), expenseController.getExpense);

// --- Creation & Updates ---
router.post('/', 
    requirePermission('expenses', 'write'),
    createExpenseValidator,
    validate,
    expenseController.createExpense
);

router.put('/:id', 
    requirePermission('expenses', 'write'),
    updateExpenseValidator,
    validate,
    expenseController.updateExpense
);

router.put('/:id/pay', 
    requirePermission('expenses', 'write'),
    markPaidValidator,
    validate,
    expenseController.markAsPaid
);

router.delete('/:id', requirePermission('expenses', 'delete'), expenseController.deleteExpense);

module.exports = router;
