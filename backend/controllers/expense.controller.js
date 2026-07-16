const Expense = require('../models/Expense');
const WalletTransaction = require('../models/WalletTransaction');
const WalletAccount = require('../models/WalletAccount');
const ExpenseSubType = require('../models/ExpenseSubType');
const ExpenseType = require('../models/ExpenseType');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

/**
 * List expenses with filters
 */
exports.listExpenses = async (req, res) => {
  try {
    let { status, category, date_from, date_to, search, page = 1, limit = 10 } = req.query;
    limit = Math.min(parseInt(limit), 100);
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (status) whereClause.status = status;
    if (req.query.expense_sub_type_id) whereClause.expense_sub_type_id = req.query.expense_sub_type_id;
    
    if (date_from || date_to) {
      whereClause.created_at = {};
      if (date_from) whereClause.created_at[Op.gte] = new Date(date_from);
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setHours(23, 59, 59, 999);
        whereClause.created_at[Op.lte] = endDate;
      }
    }

    if (search) {
      whereClause.description = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await Expense.findAndCountAll({
      where: whereClause,
      include: [
        { model: WalletAccount, attributes: ['id', 'name'] },
        { 
            model: ExpenseSubType, 
            as: 'SubType', 
            attributes: ['id', 'sub_type_name'],
            include: [{ model: ExpenseType, as: 'ParentType', attributes: ['id', 'type_name'] }]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    const totalAmount = await Expense.sum('amount', { where: whereClause });

    res.json({ 
      success: true, 
      data: rows,
      meta: { 
        total: count,
        total_sum: totalAmount || 0,
        page: parseInt(page),
        last_page: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error('List Expenses Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
};

/**
 * Get Single Expense
 */
exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id, {
      include: [
        { model: WalletAccount, attributes: ['id', 'name'] },
        { 
            model: ExpenseSubType, 
            as: 'SubType', 
            attributes: ['id', 'sub_type_name'],
            include: [{ model: ExpenseType, as: 'ParentType', attributes: ['id', 'type_name'] }]
        }
      ]
    });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch expense' });
  }
};

/**
 * Create Expense
 */
exports.createExpense = async (req, res) => {
  try {
    const { description, expense_sub_type_id, amount, status, payment_date, account_id, notes } = req.body;
    
    if (status === 'Paid' && !account_id) {
        return res.status(400).json({ success: false, message: 'Account is required for Paid status' });
    }

    const transaction = await sequelize.transaction();
    try {
        const expense = await Expense.create({
            description,
            expense_sub_type_id,
            amount,
            status,
            payment_date: status === 'Paid' ? (payment_date || new Date()) : null,
            account_id,
            notes,
            tenant_id: req.user.tenant_id || 1
        }, { transaction });

        if (status === 'Paid') {
            await WalletTransaction.create({
                account_id,
                type: 'Expense',
                direction: 'Out',
                amount,
                reference_id: expense.id,
                reference_type: 'Expense',
                description: `Payment for: ${description}`
            }, { transaction });

            // Update Wallet Balance
            await WalletAccount.decrement('balance', {
                by: amount,
                where: { id: account_id },
                transaction
            });
        }

        await transaction.commit();
        res.status(201).json({ success: true, data: expense });
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
  } catch (err) {
    console.error('Create Expense Error:', err);
    res.status(500).json({ success: false, message: 'Failed to create expense' });
  }
};

/**
 * Update Expense
 */
exports.updateExpense = async (req, res) => {
    try {
        const expense = await Expense.findByPk(req.params.id);
        if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

        const oldStatus = expense.status;
        const newStatus = req.body.status;

        const transaction = await sequelize.transaction();
        try {
            // Reversal Transition: Paid/Partially Paid -> Unpaid
            if ((oldStatus === 'Paid' || oldStatus === 'Partially Paid') && newStatus === 'Unpaid') {
                const transactions = await WalletTransaction.findAll({
                    where: { reference_id: expense.id, reference_type: 'Expense', type: 'Expense' },
                    transaction
                });

                for (const tx of transactions) {
                    // Re-increment balance (undo the expense)
                    await WalletAccount.increment('balance', {
                        by: tx.amount,
                        where: { id: tx.account_id },
                        transaction
                    });
                    await tx.destroy({ transaction });
                }
                
                await expense.update({ status: 'Unpaid', paid_amount: 0, payment_date: null, account_id: null }, { transaction });
            } 
            // Generic Update
            else {
                let updateData = { ...req.body };
                await expense.update(updateData, { transaction });
            }

            await transaction.commit();
            res.json({ success: true, data: expense });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update expense' });
    }
};

/**
 * Mark as Paid
 */
exports.markAsPaid = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { account_id, payment_date, amount } = req.body;
    const expense = await Expense.findByPk(req.params.id, { transaction });

    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    if (expense.status === 'Paid') return res.status(400).json({ success: false, message: 'Expense already fully paid' });

    if (!account_id) return res.status(400).json({ success: false, message: 'Wallet Account is required' });

    const paymentAmount = parseFloat(amount) || (parseFloat(expense.amount) - parseFloat(expense.paid_amount));

    if (paymentAmount <= 0) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    const newPaidAmount = parseFloat(expense.paid_amount) + paymentAmount;
    const finalStatus = newPaidAmount >= parseFloat(expense.amount) ? 'Paid' : 'Partially Paid';

    await expense.update({
        status: finalStatus,
        account_id,
        paid_amount: newPaidAmount,
        payment_date: payment_date || new Date()
    }, { transaction });

    await WalletTransaction.create({
        account_id,
        type: 'Expense',
        direction: 'Out',
        amount: paymentAmount,
        reference_id: expense.id,
        reference_type: 'Expense',
        description: `Payment for: ${expense.description}`
    }, { transaction });

    // Update Wallet Balance
    await WalletAccount.decrement('balance', {
        by: paymentAmount,
        where: { id: account_id },
        transaction
    });

    await transaction.commit();
    res.json({ success: true, message: `Expense marked as ${finalStatus}` });
  } catch (err) {
    await transaction.rollback();
    console.error('Pay Expense Error:', err);
    res.status(500).json({ success: false, message: 'Failed to process payment' });
  }
};

/**
 * Delete Expense
 */
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    
    if (expense.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Cannot delete a paid expense. Revert payment first.' });
    }

    await expense.destroy();
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete expense' });
  }
};
