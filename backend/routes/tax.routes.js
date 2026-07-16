const express = require('express');
const router = express.Router();
const taxController = require('../controllers/tax.controller');
const { taxValidator } = require('../validators/tax.validators');
const { verifyToken, requirePermission } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', requirePermission('settings', 'read'), taxController.getTaxes);
router.post('/', requirePermission('settings', 'write'), taxValidator, taxController.createTax);
router.put('/:id', requirePermission('settings', 'write'), taxValidator, taxController.updateTax);
router.delete('/:id', requirePermission('settings', 'delete'), taxController.deleteTax);

module.exports = router;
