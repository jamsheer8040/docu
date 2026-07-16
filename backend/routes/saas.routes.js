const express = require('express');
const router = express.Router();
const saasController = require('../controllers/saas.controller');
const { verifyToken, requireSuperAdmin } = require('../middleware/auth.middleware');

// Apply Super Admin protection to all SaaS portal routes
router.use(verifyToken);
router.use(requireSuperAdmin);

// Dashboard stats
router.get('/stats', saasController.getDashboardStats);

// Tenant Management
router.get('/tenants', saasController.getTenants);
router.get('/tenants/:id/history', saasController.getTenantHistory);
router.put('/tenants/:id/plan', saasController.updateTenantPlan);
router.put('/tenants/:id/status', saasController.toggleTenantStatus);

// Plan Management
router.get('/plans', saasController.getPlans);
router.post('/plans', saasController.createPlan);
router.put('/plans/:id', saasController.updatePlan);

// Billing Management
router.get('/invoices', saasController.getInvoices);
router.post('/invoices/:id/pay', saasController.payInvoice);

module.exports = router;
