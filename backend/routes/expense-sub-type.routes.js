const express = require('express');
const router = express.Router();
const expenseSubTypeController = require('../controllers/expense-sub-type.controller');
const { protect, requirePermission } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', requirePermission('settings', 'read'), expenseSubTypeController.listSubTypes);
router.post('/', requirePermission('settings', 'write'), expenseSubTypeController.createSubType);
router.put('/:id', requirePermission('settings', 'write'), expenseSubTypeController.updateSubType);
router.delete('/:id', requirePermission('settings', 'write'), expenseSubTypeController.deleteSubType);

module.exports = router;
