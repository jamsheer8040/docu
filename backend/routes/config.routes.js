const express = require('express');
const router = express.Router();
const configController = require('../controllers/config.controller');
const { verifyToken, requirePermission } = require('../middleware/auth.middleware');

router.get('/', configController.getConfigs);
router.put('/', verifyToken, requirePermission('settings', 'write'), configController.updateConfigs);
router.post('/upload-logo', verifyToken, requirePermission('settings', 'write'), configController.upload.single('logo'), configController.uploadLogo);

module.exports = router;
