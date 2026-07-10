const { Op, fn, col, literal } = require('sequelize');
const Invoice = require('../models/Invoice');
const InvoiceItem = require('../models/InvoiceItem');
const Expense = require('../models/Expense');
const Customer = require('../models/Customer');
const sequelize = require('../config/database');

/**
 * Helper to generate date range where clause
 */
const getDateRangeWhere = (query) => {
    const { from, to } = query;
    const where = {};
    if (from || to) {
        where.created_at = {};
        if (from) where.created_at[Op.gte] = new Date(from);
        if (to) {
            const endDate = new Date(to);
            endDate.setHours(23, 59, 59, 999);
            where.created_at[Op.lte] = endDate;
        }
    }
    return where;
};

/**
 * Global Financial Summary
 */
exports.getFinancialSummary = async (req, res) => {
  try {
    const dateWhere = getDateRangeWhere(req.query);
    const invoiceWhere = { 
        [Op.or]: [{ status: 'Paid' }, { status: 'Partially Paid' }], 
        ...dateWhere 
    };

    const [revenueRes, costRes, invCount] = await Promise.all([
      Invoice.sum('paid_amount', { where: invoiceWhere }),
      Expense.sum('paid_amount', { where: { [Op.or]: [{ status: 'Paid' }, { status: 'Partially Paid' }], ...dateWhere } }),
      Invoice.count({ where: invoiceWhere })
    ]);

    const totalRevenue = parseFloat(revenueRes || 0);
    const totalCost = parseFloat(costRes || 0);
    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    res.json({
      success: true,
      data: {
        total_revenue: totalRevenue,
        total_cost: totalCost,
        net_profit: netProfit,
        profit_margin: profitMargin,
        invoice_count: invCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch financial summary' });
  }
};

/**
 * Monthly Trends
 */
exports.getMonthlyTrends = async (req, res) => {
  try {
    const dateWhere = getDateRangeWhere(req.query);
    
    // If no dates provided, default to last 6 months
    if (!req.query.from && !req.query.to) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        dateWhere.created_at = { [Op.gte]: sixMonthsAgo };
    }

    const trends = await Invoice.findAll({
      where: { [Op.or]: [{ status: 'Paid' }, { status: 'Partially Paid' }], ...dateWhere },
      attributes: [
        [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'month_key'],
        [fn('DATE_FORMAT', col('created_at'), '%b %Y'), 'month'],
        [fn('SUM', col('paid_amount')), 'revenue']
      ],
      group: ['month_key', 'month'],
      order: [[col('month_key'), 'ASC']]
    });

    const costs = await Expense.findAll({
      where: { [Op.or]: [{ status: 'Paid' }, { status: 'Partially Paid' }], ...dateWhere },
      attributes: [
        [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'month_key'],
        [fn('DATE_FORMAT', col('created_at'), '%b %Y'), 'month'],
        [fn('SUM', col('paid_amount')), 'cost']
      ],
      group: ['month_key', 'month'],
      order: [[col('month_key'), 'ASC']]
    });

    res.json({
      success: true,
      data: { trends, costs }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch trends' });
  }
};

/**
 * Revenue by Service Type
 */
exports.getRevenueByService = async (req, res) => {
    try {
        const dateWhere = getDateRangeWhere(req.query);
        const results = await InvoiceItem.findAll({
            attributes: [
                'description',
                // Note: InvoiceItem total represents the line item value. 
                // Line items dont have "paid_amount", but usually we report based on invoices that are paid.
                // For partial payments, it's complex, but usually we show the full billable value of the items.
                [fn('SUM', col('InvoiceItem.total')), 'total_revenue']
            ],
            include: [{
                model: Invoice,
                where: { [Op.or]: [{ status: 'Paid' }, { status: 'Partially Paid' }], ...dateWhere },
                attributes: []
            }],
            group: ['description'],
            order: [[literal('total_revenue'), 'DESC']],
            limit: 10
        });

        res.json({ success: true, data: results });
    } catch (err) {
        console.error('getRevenueByService Error:', err);
        res.status(500).json({ success: false, message: 'Failed breakdown' });
    }
};

/**
 * Expense by Category
 */
exports.getExpenseByCategory = async (req, res) => {
    try {
        const dateWhere = getDateRangeWhere(req.query);
        const results = await Expense.findAll({
            attributes: [
                'category',
                [fn('SUM', col('paid_amount')), 'total_amount']
            ],
            where: { [Op.or]: [{ status: 'Paid' }, { status: 'Partially Paid' }], ...dateWhere },
            group: ['category'],
            order: [[literal('total_amount'), 'DESC']]
        });
        res.json({ success: true, data: results });
    } catch (err) {
        console.error('getExpenseByCategory Error:', err);
        res.status(500).json({ success: false, message: 'Failed expense breakdown' });
    }
};

/**
 * Top Customers
 */
exports.getTopCustomers = async (req, res) => {
    try {
        const dateWhere = getDateRangeWhere(req.query);
        const results = await Invoice.findAll({
            attributes: [
                'customer_id',
                [fn('SUM', col('paid_amount')), 'total_invoiced'],
                [fn('COUNT', col('Invoice.id')), 'invoice_count']
            ],
            where: { [Op.or]: [{ status: 'Paid' }, { status: 'Partially Paid' }], ...dateWhere },
            include: [{ model: Customer, attributes: ['name'] }],
            group: ['Invoice.customer_id', 'Customer.id', 'Customer.name'],
            order: [[literal('total_invoiced'), 'DESC']],
            limit: 10
        });
        res.json({ success: true, data: results });
    } catch (err) {
        console.error('getTopCustomers Error:', err);
        res.status(500).json({ success: false, message: 'Failed leaderboards', error: err.message });
    }
};
