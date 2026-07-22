const { Lead, Customer, User, LeadStatusHistory, ServiceType } = require('../models');

exports.getLeads = async (req, res) => {
  try {
    const leads = await Lead.findAll({
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'Creator', attributes: ['id', 'name'] },
        { model: Customer, as: 'Customer', attributes: ['id', 'name'] },
        { model: ServiceType, as: 'Service', attributes: ['id', 'name'] }
      ]
    });
    res.status(200).json({ success: true, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findByPk(req.params.id, {
      include: [
        { model: User, as: 'Creator', attributes: ['id', 'name'] },
        { model: ServiceType, as: 'Service', attributes: ['id', 'name'] }
      ]
    });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createLead = async (req, res) => {
  try {
    const data = {
      ...req.body,
      tenant_id: req.user.tenant_id,
      created_by: req.user.id
    };
    const lead = await Lead.create(data);
    
    // Log initial status
    await LeadStatusHistory.create({
      lead_id: lead.id,
      previous_status: null,
      new_status: lead.status || 'New',
      changed_by: req.user.id,
      update_source: req.body.update_source || 'Details'
    });

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    
    const previousStatus = lead.status;
    const newStatus = req.body.status;
    
    await lead.update(req.body);

    if (newStatus && previousStatus !== newStatus) {
      await LeadStatusHistory.create({
        lead_id: lead.id,
        previous_status: previousStatus,
        new_status: newStatus,
        changed_by: req.user.id,
        update_source: req.body.update_source || 'Details'
      });
    }

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    await lead.destroy();
    res.status(200).json({ success: true, message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.convertLead = async (req, res) => {
  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    if (lead.customer_id) {
      return res.status(400).json({ success: false, message: 'Lead is already linked to a customer.' });
    }

    if (lead.status !== 'Won') {
      return res.status(400).json({ success: false, message: 'Lead must be in Won status to convert.' });
    }

    // Check if email already exists as a customer within the same tenant
    if (lead.email) {
      const existingCustomer = await Customer.findOne({ 
        where: { email: lead.email, tenant_id: req.user.tenant_id } 
      });
      if (existingCustomer) {
        return res.status(400).json({ success: false, message: 'A customer with this email already exists' });
      }
    }

    // Create the customer
    const customerName = lead.company_name || lead.name;
    const newCustomerData = {
      name: customerName,
      email: lead.email || null,
      phone_whatsapp: lead.phone,
      notes: lead.notes || '',
      is_active: true,
      pricing_category: 'Normal',
      tenant_id: req.user.tenant_id
    };

    const customerData = await Customer.create(newCustomerData);
    
    // Link customer to lead and set converted_at
    await lead.update({ 
      customer_id: customerData.id,
      converted_by: req.user.id,
      converted_at: new Date()
    });

    res.status(200).json({ 
      success: true, 
      message: 'Lead successfully converted to Customer',
      data: {
        customer: customerData,
        lead: lead
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.trackWhatsappClick = async (req, res) => {
  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    await lead.increment('whatsapp_clicks', { by: 1 });
    await lead.reload();

    res.status(200).json({ success: true, whatsapp_clicks: lead.whatsapp_clicks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
