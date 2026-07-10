const express = require('express');
const router = express.Router();
const controller = require('../controllers/documentType.controller');
const { verifyToken, requirePermission } = require('../middleware/auth.middleware');

router.get('/', verifyToken, requirePermission('settings', 'read'), controller.list);
router.post('/', verifyToken, requirePermission('settings', 'write'), controller.create);
router.put('/:id', verifyToken, requirePermission('settings', 'write'), controller.update);
router.delete('/:id', verifyToken, requirePermission('settings', 'delete'), controller.delete);

module.exports = router;
