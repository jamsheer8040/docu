const { Tax } = require('../models');
const { validationResult } = require('express-validator');

exports.getTaxes = async (req, res) => {
  try {
    const taxes = await Tax.findAll({
      where: { tenant_id: req.tenantId },
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: taxes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch taxes' });
  }
};

exports.createTax = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const value = req.body;
    const existing = await Tax.findOne({
      where: { name: value.name, tenant_id: req.tenantId }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Tax name already exists' });
    }

    const tax = await Tax.create({
      ...value,
      tenant_id: req.tenantId
    });

    res.status(201).json({ success: true, data: tax });
  } catch (err) {
    console.error('Create Tax Error:', err);
    res.status(500).json({ success: false, message: 'Failed to create tax' });
  }
};

exports.updateTax = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const { id } = req.params;
    const value = req.body;
    
    const tax = await Tax.findOne({ where: { id, tenant_id: req.tenantId } });
    if (!tax) {
      return res.status(404).json({ success: false, message: 'Tax not found' });
    }

    if (value.name && value.name !== tax.name) {
      const existing = await Tax.findOne({
        where: { name: value.name, tenant_id: req.tenantId }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Tax name already exists' });
      }
    }

    await tax.update(value);
    res.json({ success: true, data: tax });
  } catch (err) {
    console.error('Update Tax Error:', err);
    res.status(500).json({ success: false, message: 'Failed to update tax' });
  }
};

exports.deleteTax = async (req, res) => {
  try {
    const { id } = req.params;
    const tax = await Tax.findOne({ where: { id, tenant_id: req.tenantId } });
    
    if (!tax) {
      return res.status(404).json({ success: false, message: 'Tax not found' });
    }

    await tax.destroy();
    res.json({ success: true, message: 'Tax deleted successfully' });
  } catch (err) {
    console.error('Delete Tax Error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete tax' });
  }
};
