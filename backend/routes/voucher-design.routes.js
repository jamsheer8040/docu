const express = require('express');
const router = express.Router();
const voucherDesignController = require('../controllers/voucher-design.controller');
const { verifyToken, requirePermission } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/', requirePermission('settings', 'read'), voucherDesignController.listTemplates);
router.get('/audit-logs', requirePermission('settings', 'read'), voucherDesignController.getAuditLogs);
router.get('/:id', requirePermission('settings', 'read'), voucherDesignController.getTemplate);
router.post('/', requirePermission('settings', 'write'), voucherDesignController.createTemplate);
router.put('/:id', requirePermission('settings', 'write'), voucherDesignController.updateTemplate);
router.put('/:id/default', requirePermission('settings', 'write'), voucherDesignController.setDefaultTemplate);
router.delete('/:id', requirePermission('settings', 'delete'), voucherDesignController.deleteTemplate);

module.exports = router;
