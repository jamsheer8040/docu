const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { verifyToken, requirePermission } = require('../middleware/auth.middleware');

// All reports are protected
router.use(verifyToken);

router.get('/financial-summary', requirePermission('reports', 'read'), reportsController.getFinancialSummary);
router.get('/monthly-trends', requirePermission('reports', 'read'), reportsController.getMonthlyTrends);
router.get('/revenue-by-service', requirePermission('reports', 'read'), reportsController.getRevenueByService);
router.get('/expense-by-category', requirePermission('reports', 'read'), reportsController.getExpenseByCategory);
router.get('/customer-summary', requirePermission('reports', 'read'), reportsController.getTopCustomers);
router.get('/profit-details', requirePermission('reports', 'read'), reportsController.getProfitReportDetails);
router.get('/service-wise-details', requirePermission('reports', 'read'), reportsController.getServiceWiseReport);
router.get('/balance-sheet', requirePermission('reports', 'read'), reportsController.getBalanceSheet);

module.exports = router;
