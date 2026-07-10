const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { protect, requirePermission } = require('../middleware/auth.middleware');

// All role routes require authentication
router.use(protect);

router.get('/', requirePermission('settings', 'read'), roleController.getRoles);
router.get('/:id', requirePermission('settings', 'read'), roleController.getRoleById);
router.post('/', requirePermission('settings', 'write'), roleController.createRole);
router.put('/:id', requirePermission('settings', 'write'), roleController.updateRole);
router.delete('/:id', requirePermission('settings', 'delete'), roleController.deleteRole);

module.exports = router;
