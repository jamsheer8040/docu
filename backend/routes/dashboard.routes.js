const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { verifyToken, requirePermission } = require('../middleware/auth.middleware');

// All dashboard routes are protected
router.use(verifyToken);

router.get('/stats', requirePermission('dashboard', 'read'), dashboardController.getStats);
router.get('/recent-activity', requirePermission('dashboard', 'read'), dashboardController.getRecentActivity);

module.exports = router;
