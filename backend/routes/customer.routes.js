const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { customerValidator } = require('../validators/customer.validators');
const { verifyToken, requirePermission } = require('../middleware/auth.middleware');
const { checkCustomerLimit } = require('../middleware/limit.middleware');

// All customer routes require authentication
router.use(verifyToken);

router.get('/', requirePermission('customers', 'read'), customerController.getCustomers);
router.get('/:id', requirePermission('customers', 'read'), customerController.getCustomerById);
router.post('/', requirePermission('customers', 'write'), checkCustomerLimit, customerValidator, customerController.createCustomer);
router.put('/:id', requirePermission('customers', 'write'), customerValidator, customerController.updateCustomer);
router.delete('/:id', requirePermission('customers', 'delete'), customerController.deleteCustomer);

router.post('/bulk-import', requirePermission('customers', 'write'), checkCustomerLimit, customerController.importBulkCustomers);

module.exports = router;
