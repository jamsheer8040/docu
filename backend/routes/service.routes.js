const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const { validateServiceType, validateServiceOrder } = require('../validators/service.validators');
const { protect, requirePermission } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware.js');

// Apply protection to all service routes
router.use(protect);

/**
 * Service Types (Catalog) - Part of System Configuration
 */
router.get('/types', requirePermission('settings', 'read'), serviceController.getServiceTypes);
router.post('/types', requirePermission('settings', 'write'), validateServiceType, validate, serviceController.createServiceType);
router.put('/types/:id', requirePermission('settings', 'write'), validateServiceType, validate, serviceController.updateServiceType);
router.delete('/types/:id', requirePermission('settings', 'delete'), serviceController.deleteServiceType);

/**
 * Service Orders (Workflow)
 */
router.get('/orders', requirePermission('services', 'read'), serviceController.getServiceOrders);
router.post('/orders', requirePermission('services', 'write'), validateServiceOrder, validate, serviceController.createServiceOrder);
router.put('/orders/:id', requirePermission('services', 'write'), validateServiceOrder, validate, serviceController.updateServiceOrder);
router.post('/orders/escalate', requirePermission('services', 'write'), serviceController.runEscalation);
router.get('/config/criticality', requirePermission('settings', 'read'), serviceController.getCriticalityConfig);
router.put('/config/criticality', requirePermission('settings', 'write'), serviceController.saveCriticalityConfig);
router.put('/orders/:id/status', requirePermission('services', 'write'), serviceController.updateServiceOrderStatus);
router.post('/orders/:id/remind', requirePermission('services', 'write'), serviceController.incrementReminderCount);
router.delete('/orders/:id', requirePermission('services', 'delete'), serviceController.deleteServiceOrder);

module.exports = router;
