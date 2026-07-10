const { User, Role, Customer } = require('../models');
const { validationResult } = require('express-validator');

exports.getUsers = async (req, res) => {
  try {
    const where = {};
    if (req.user?.Role?.name !== 'Developer') {
      where['$Role.name$'] = { [require('sequelize').Op.ne]: 'Developer' };
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Role, attributes: ['name', 'permissions', 'type'] },
        { model: Customer, as: 'LinkedCustomers', attributes: ['id', 'name'] }
      ],
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching users.' });
  }
};

exports.createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, email, password, role_id, customer_ids } = req.body;
    const user = await User.create({
      name,
      email,
      password_hash: password, // hooks hash it
      role_id
    });

    if (role_id && customer_ids && Array.isArray(customer_ids)) {
      await user.setLinkedCustomers(customer_ids);
    }

    const populated = await User.findByPk(user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Role, attributes: ['name', 'permissions', 'type'] },
        { model: Customer, as: 'LinkedCustomers', attributes: ['id', 'name'] }
      ]
    });

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'Email already in use.' });
    }
    res.status(500).json({ success: false, message: 'Error creating user.' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { name, email, password, role_id, customer_ids, is_active } = req.body;
    const updateData = { name, email, role_id, is_active };
    if (password) {
      updateData.password_hash = password;
    }

    await user.update(updateData);
    
    if (role_id && customer_ids && Array.isArray(customer_ids)) {
      await user.setLinkedCustomers(customer_ids);
    } else if (!role_id || !customer_ids || customer_ids.length === 0) {
      await user.setLinkedCustomers([]);
    }
    
    const populated = await User.findByPk(user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Role, attributes: ['name', 'permissions', 'type'] },
        { model: Customer, as: 'LinkedCustomers', attributes: ['id', 'name'] }
      ]
    });

    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating user.' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prevent deleting the primary admin account
    if (user.id === 1 || user.Role?.name === 'Admin') {
        return res.status(400).json({ success: false, message: 'The primary administrator account cannot be deleted.' });
    }

    // Prevent deleting self
    if (user.id === req.user.id) {
        return res.status(400).json({ success: false, message: 'You cannot delete yourself.' });
    }

    await user.destroy();
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting user.' });
  }
};
