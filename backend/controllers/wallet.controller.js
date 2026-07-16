const { Op } = require('sequelize');
const sequelize = require('../config/database');
const WalletAccount = require('../models/WalletAccount');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * Get all accounts with computed balance
 */
exports.getAccounts = async (req, res) => {
  try {
    const accounts = await WalletAccount.findAll({
      where: { is_active: true }
    });

    const accountsWithBalance = await Promise.all(accounts.map(async (account) => {
      const inSum = await WalletTransaction.sum('amount', {
        where: { account_id: account.id, direction: 'In' }
      }) || 0;
      const outSum = await WalletTransaction.sum('amount', {
        where: { account_id: account.id, direction: 'Out' }
      }) || 0;

      return {
        ...account.toJSON(),
        balance: parseFloat(inSum) - parseFloat(outSum)
      };
    }));

    res.json({ success: true, data: accountsWithBalance });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching accounts.' });
  }
};

/**
 * Get transaction history with filters
 */
exports.getTransactions = async (req, res) => {
  const { account_id, type, date_from, date_to, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (account_id) where.account_id = account_id;
  if (type) where.type = type;
  if (date_from || date_to) {
    where.created_at = {};
    if (date_from) where.created_at[Op.gte] = new Date(date_from);
    if (date_to) {
        const endDate = new Date(date_to);
        endDate.setHours(23, 59, 59, 999);
        where.created_at[Op.lte] = endDate;
    }
  }

  try {
    const { count, rows } = await WalletTransaction.findAndCountAll({
      where,
      include: [{ model: WalletAccount, attributes: ['name'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: rows,
      meta: {
        total: count,
        page: parseInt(page),
        last_page: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching transactions.' });
  }
};

/**
 * Handle manual transfer between accounts
 */
exports.transfer = async (req, res) => {
  const { from_account_id, to_account_id, amount, description } = req.body;

  if (from_account_id === to_account_id) {
    return res.status(400).json({ success: false, message: 'Source and destination accounts must be different.' });
  }

  const t = await sequelize.transaction();

  try {
    // 1. Verify source balance
    const inSum = await WalletTransaction.sum('amount', {
      where: { account_id: from_account_id, direction: 'In' },
      transaction: t
    }) || 0;
    const outSum = await WalletTransaction.sum('amount', {
      where: { account_id: from_account_id, direction: 'Out' },
      transaction: t
    }) || 0;
    const currentBalance = parseFloat(inSum) - parseFloat(outSum);

    if (currentBalance < amount) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Insufficient balance in source account.' });
    }

    // 2. Create Out transaction
    await WalletTransaction.create({
      account_id: from_account_id,
      type: 'Transfer',
      direction: 'Out',
      amount,
      description: `Transfer to ${to_account_id}: ${description || ''}`
    }, { transaction: t });

    // 3. Create In transaction
    await WalletTransaction.create({
      account_id: to_account_id,
      type: 'Transfer',
      direction: 'In',
      amount,
      description: `Transfer from ${from_account_id}: ${description || ''}`
    }, { transaction: t });

    await t.commit();
    res.json({ success: true, message: 'Transfer completed successfully.' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, message: 'Internal server error during transfer.' });
  }
};

/**
 * Get wallet summary
 */
exports.getSummary = async (req, res) => {
  try {
    const inTotal = await WalletTransaction.sum('amount', { where: { direction: 'In' } }) || 0;
    const outTotal = await WalletTransaction.sum('amount', { where: { direction: 'Out' } }) || 0;

    res.json({
      success: true,
      data: {
        total_balance: parseFloat(inTotal) - parseFloat(outTotal)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching summary.' });
  }
};

exports.createAccount = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, description, opening_balance } = req.body;
    if (!name) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    
    const existing = await WalletAccount.findOne({ where: { name }, transaction: t });
    if (existing) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Wallet name already exists' });
    }

    const account = await WalletAccount.create({ name, description }, { transaction: t });
    
    let balance = 0;
    if (opening_balance && parseFloat(opening_balance) > 0) {
      balance = parseFloat(opening_balance);
      await WalletTransaction.create({
        account_id: account.id,
        type: 'Manual',
        direction: 'In',
        amount: balance,
        description: 'Opening Balance'
      }, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ success: true, data: { ...account.toJSON(), balance } });
  } catch (err) {
    await t.rollback();
    console.error('Error creating wallet account:', err);
    res.status(500).json({ success: false, message: 'Error creating wallet account.' });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const account = await WalletAccount.findByPk(id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    if (name && name !== account.name) {
      const existing = await WalletAccount.findOne({ where: { name } });
      if (existing) return res.status(400).json({ success: false, message: 'Wallet name already exists' });
    }

    await account.update({ 
      name: name || account.name, 
      description: description !== undefined ? description : account.description 
    });
    
    res.json({ success: true, data: account });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating wallet account.' });
  }
};
