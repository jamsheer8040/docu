const { VoucherDesign, VoucherDesignAuditLog, User } = require('../models');

/**
 * List all voucher templates
 */
exports.listTemplates = async (req, res) => {
  try {
    const templates = await VoucherDesign.findAll({
      order: [['voucher_type', 'ASC'], ['is_default', 'DESC'], ['name', 'ASC']]
    });
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('[VoucherDesignController] listTemplates error:', error);
    res.status(500).json({ success: false, message: 'Server error listing templates' });
  }
};

/**
 * Get a single voucher template
 */
exports.getTemplate = async (req, res) => {
  try {
    const template = await VoucherDesign.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('[VoucherDesignController] getTemplate error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching template' });
  }
};

/**
 * Create a new voucher template
 */
exports.createTemplate = async (req, res) => {
  try {
    const {
      voucher_type,
      name,
      branch,
      language,
      layout,
      header_config,
      info_config,
      table_config,
      totals_config,
      footer_config,
      branding_config,
      print_config,
      number_format
    } = req.body;

    const tenant_id = req.user.tenant_id;

    // Check if this is the first template for this type - if so, make it default
    const existingCount = await VoucherDesign.count({ where: { voucher_type } });
    const is_default = existingCount === 0;

    const template = await VoucherDesign.create({
      voucher_type,
      name,
      is_default,
      branch: branch || null,
      language: language || 'English',
      layout: layout || 'A4 Portrait',
      header_config,
      info_config,
      table_config,
      totals_config,
      footer_config,
      branding_config,
      print_config,
      number_format,
      tenant_id
    });

    // Create audit log
    await VoucherDesignAuditLog.create({
      user_id: req.user.id,
      voucher_type,
      template_name: name,
      action: 'CREATE',
      new_values: template.toJSON(),
      tenant_id
    });

    res.status(201).json({ success: true, data: template, message: 'Template created successfully' });
  } catch (error) {
    console.error('[VoucherDesignController] createTemplate error:', error);
    res.status(500).json({ success: false, message: 'Server error creating template' });
  }
};

/**
 * Update a voucher template
 */
exports.updateTemplate = async (req, res) => {
  try {
    const template = await VoucherDesign.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const previous_values = template.toJSON();

    const {
      name,
      branch,
      language,
      layout,
      header_config,
      info_config,
      table_config,
      totals_config,
      footer_config,
      branding_config,
      print_config,
      number_format
    } = req.body;

    await template.update({
      name: name || template.name,
      branch: branch !== undefined ? branch : template.branch,
      language: language || template.language,
      layout: layout || template.layout,
      header_config: header_config || template.header_config,
      info_config: info_config || template.info_config,
      table_config: table_config || template.table_config,
      totals_config: totals_config || template.totals_config,
      footer_config: footer_config || template.footer_config,
      branding_config: branding_config || template.branding_config,
      print_config: print_config || template.print_config,
      number_format: number_format || template.number_format
    });

    const new_values = template.toJSON();

    // Create audit log
    await VoucherDesignAuditLog.create({
      user_id: req.user.id,
      voucher_type: template.voucher_type,
      template_name: template.name,
      action: 'UPDATE',
      previous_values,
      new_values,
      tenant_id: req.user.tenant_id
    });

    res.json({ success: true, data: template, message: 'Template updated successfully' });
  } catch (error) {
    console.error('[VoucherDesignController] updateTemplate error:', error);
    res.status(500).json({ success: false, message: 'Server error updating template' });
  }
};

/**
 * Delete a template
 */
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await VoucherDesign.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    if (template.is_default) {
      return res.status(400).json({ success: false, message: 'Cannot delete default template. Assign another template as default first.' });
    }

    const previous_values = template.toJSON();

    await template.destroy();

    // Create audit log
    await VoucherDesignAuditLog.create({
      user_id: req.user.id,
      voucher_type: template.voucher_type,
      template_name: template.name,
      action: 'DELETE',
      previous_values,
      tenant_id: req.user.tenant_id
    });

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('[VoucherDesignController] deleteTemplate error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting template' });
  }
};

/**
 * Set template as default for its type
 */
exports.setDefaultTemplate = async (req, res) => {
  try {
    const template = await VoucherDesign.findByPk(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    // Set all templates of this type to false
    await VoucherDesign.update(
      { is_default: false },
      { where: { voucher_type: template.voucher_type } }
    );

    // Set this one to true
    await template.update({ is_default: true });

    // Create audit log
    await VoucherDesignAuditLog.create({
      user_id: req.user.id,
      voucher_type: template.voucher_type,
      template_name: template.name,
      action: 'SET_DEFAULT',
      new_values: { is_default: true },
      tenant_id: req.user.tenant_id
    });

    res.json({ success: true, message: `"${template.name}" is now the default template for ${template.voucher_type}.` });
  } catch (error) {
    console.error('[VoucherDesignController] setDefaultTemplate error:', error);
    res.status(500).json({ success: false, message: 'Server error setting default template' });
  }
};

/**
 * Fetch all design audit logs
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await VoucherDesignAuditLog.findAll({
      include: [
        { model: User, attributes: ['id', 'name', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('[VoucherDesignController] getAuditLogs error:', error);
    res.status(500).json({ success: false, message: 'Server error listing audit logs' });
  }
};
