const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { verifyToken, requirePermission } = require('../middleware/auth.middleware');
const { transferValidator } = require('../validators/wallet.validator');
const validate = require('../middleware/validate.middleware');

// All wallet routes require authentication
router.use(verifyToken);

router.get('/accounts', requirePermission('wallet', 'read'), walletController.getAccounts);
router.post('/accounts', requirePermission('wallet', 'write'), walletController.createAccount);
router.put('/accounts/:id', requirePermission('wallet', 'write'), walletController.updateAccount);
router.get('/transactions', requirePermission('wallet', 'read'), walletController.getTransactions);
router.get('/summary', requirePermission('wallet', 'read'), walletController.getSummary);
router.post('/transfer', requirePermission('wallet', 'write'), transferValidator, validate, walletController.transfer);

module.exports = router;
