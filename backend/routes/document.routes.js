const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const { createDocumentValidator, updateDocumentValidator } = require('../validators/document.validators');
const upload = require('../middleware/upload.middleware');

const { verifyToken, requirePermission } = require('../middleware/auth.middleware');
const { checkDocumentLimit } = require('../middleware/limit.middleware');

// All document routes require authentication
router.use(verifyToken);

router.get('/', requirePermission('documents', 'read'), documentController.getDocuments);
router.get('/expiring', requirePermission('documents', 'read'), documentController.getExpiringDocuments);
router.get('/staff/names', requirePermission('documents', 'read'), documentController.getStaffNames);
router.get('/:id', requirePermission('documents', 'read'), documentController.getDocumentById);
router.post('/', requirePermission('documents', 'write'), upload.single('file'), checkDocumentLimit, createDocumentValidator, documentController.createDocument);
router.put('/:id', requirePermission('documents', 'write'), upload.single('file'), updateDocumentValidator, documentController.updateDocument);
router.post('/:id/remind', requirePermission('documents', 'write'), documentController.incrementReminderCount);
router.delete('/:id', requirePermission('documents', 'delete'), documentController.deleteDocument);

module.exports = router;
