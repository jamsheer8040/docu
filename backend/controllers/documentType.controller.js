const { DocumentType } = require('../models');

exports.list = async (req, res) => {
  try {
    const types = await DocumentType.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, data: types });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch document types' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, category = 'Company Document' } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    
    // Check if exists
    const exists = await DocumentType.findOne({ where: { name } });
    if (exists) return res.status(400).json({ success: false, message: 'Type already exists' });

    const newType = await DocumentType.create({ name, category });
    res.status(201).json({ success: true, data: newType });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create document type' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    // Check if exists for ANOTHER id
    const { Op } = require('sequelize');
    const exists = await DocumentType.findOne({ 
      where: { 
        name,
        id: { [Op.ne]: id }
      } 
    });
    if (exists) return res.status(400).json({ success: false, message: 'Type with this name already exists' });

    await DocumentType.update({ name, category }, { where: { id } });
    res.json({ success: true, message: 'Document type updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update document type' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await DocumentType.destroy({ where: { id } });
    res.json({ success: true, message: 'Document type deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete document type' });
  }
};
