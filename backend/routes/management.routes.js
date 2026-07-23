const express = require('express');
const router = express.Router();
const managementController = require('../controllers/management.controller');
const { protect, requirePermission } = require('../middleware/auth.middleware');

router.use(protect);

// All routes here require the 'management' permission
const checkManagementWrite = requirePermission('management', 'write');
const checkManagementRead = requirePermission('management', 'read');

// Dashboard
router.get('/dashboard', checkManagementRead, managementController.getDashboardStats);

// Shareholders
router.get('/shareholders', checkManagementRead, managementController.getShareholders);
router.post('/shareholders', checkManagementWrite, managementController.createShareholder);
router.put('/shareholders/:id', checkManagementWrite, managementController.updateShareholder);

// Capital Transactions
router.get('/capital-transactions', checkManagementRead, managementController.getCapitalTransactions);
router.post('/capital-transactions', checkManagementWrite, managementController.createCapitalTransaction);

// Dividends
router.get('/dividends', checkManagementRead, managementController.getDividends);
router.post('/dividends', checkManagementWrite, managementController.declareDividend);
router.post('/dividends/pay', checkManagementWrite, managementController.payDividend);

module.exports = router;
