const express = require('express');
const router = express.Router();
const leadController = require('../controllers/lead.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth.verifyToken);

// Both Admin and Staff can manage leads (Assuming they have 'customers' permission)
router.get('/', auth.requirePermission('customers', 'read'), leadController.getLeads);
router.get('/:id', auth.requirePermission('customers', 'read'), leadController.getLeadById);
router.post('/', auth.requirePermission('customers', 'write'), leadController.createLead);
router.put('/:id', auth.requirePermission('customers', 'write'), leadController.updateLead);
router.delete('/:id', auth.requirePermission('customers', 'delete'), leadController.deleteLead);
router.post('/:id/convert', auth.requirePermission('customers', 'write'), leadController.convertLead);
router.post('/:id/whatsapp-click', auth.requirePermission('customers', 'read'), leadController.trackWhatsappClick);


module.exports = router;
