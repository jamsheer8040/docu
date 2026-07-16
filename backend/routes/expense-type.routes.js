const express = require('express');
const router = express.Router();
const expenseTypeController = require('../controllers/expense-type.controller');
const { protect, requirePermission } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', requirePermission('settings', 'read'), expenseTypeController.listTypes);
router.post('/', requirePermission('settings', 'write'), expenseTypeController.createType);
router.put('/:id', requirePermission('settings', 'write'), expenseTypeController.updateType);
router.delete('/:id', requirePermission('settings', 'write'), expenseTypeController.deleteType);

module.exports = router;
