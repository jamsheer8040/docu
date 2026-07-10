const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, requirePermission } = require('../middleware/auth.middleware');

// Apply protection to all user routes
router.use(protect);

router.get('/', requirePermission('settings', 'read'), userController.getUsers);
router.post('/', requirePermission('settings', 'write'), userController.createUser);
router.put('/:id', requirePermission('settings', 'write'), userController.updateUser);
router.delete('/:id', requirePermission('settings', 'write'), userController.deleteUser);

module.exports = router;
