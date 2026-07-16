const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { loginValidator, registerValidator, changePasswordValidator } = require('../validators/auth.validators');
const rateLimit = require('express-rate-limit');

// Rate Limiting: Max 5 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: {
    success: false,
    message: 'Too many login attempts from this IP. To protect your account, please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/login', loginLimiter, loginValidator, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/register-tenant', authController.registerTenant);
router.get('/plans', authController.getPublicPlans);

// Protected routes
router.get('/me', verifyToken, authController.me);
router.put('/change-password', verifyToken, changePasswordValidator, authController.changePassword);

// Admin-only routes
router.post('/register', verifyToken, requireRole('Admin'), registerValidator, authController.register);

module.exports = router;
