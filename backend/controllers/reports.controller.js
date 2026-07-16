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

/**
 * Profit Details
 */
exports.getProfitReportDetails = async (req, res) => {
    try {
        const dateWhere = getDateRangeWhere(req.query);
        let { page = 1, limit = 50 } = req.query;
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const { count, rows } = await Invoice.findAndCountAll({
            where: { [Op.or]: [{ status: 'Paid' }, { status: 'Partially Paid' }, { status: 'Sent' }, { status: 'Issued' }], ...dateWhere },
            attributes: [
                'id', 'invoice_number', 'status', 'created_at',
                'subtotal', 'cost_total', 'total', 'paid_amount',
                [literal('subtotal - cost_total'), 'gross_profit'],
            ],
            include: [{ model: Customer, attributes: ['name'] }],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        const overheadCosts = await Expense.sum('paid_amount', {
            where: { [Op.or]: [{ status: 'Paid' }, { status: 'Partially Paid' }], ...dateWhere }
        });

        res.json({
            success: true,
            data: {
                invoices: rows,
                total_invoices: count,
                total_pages: Math.ceil(count / limit),
                current_page: parseInt(page),
                overhead_costs: overheadCosts || 0
            }
        });
    } catch (err) {
        console.error('getProfitReportDetails Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch profit details' });
    }
};

/**
 * Service Wise Details
 */
exports.getServiceWiseReport = async (req, res) => {
    try {
        const dateWhere = getDateRangeWhere(req.query);
        const results = await InvoiceItem.findAll({
            attributes: [
                'description',
                [fn('SUM', col('quantity')), 'total_quantity'],
                [fn('SUM', literal('selling_price * quantity')), 'total_revenue'],
                [fn('SUM', literal('cost_price * quantity')), 'total_cost'],
                [fn('SUM', literal('(selling_price - cost_price) * quantity')), 'gross_profit']
            ],
            include: [{
                model: Invoice,
                where: { [Op.or]: [{ status: 'Paid' }, { status: 'Partially Paid' }, { status: 'Issued' }, { status: 'Sent' }], ...dateWhere },
                attributes: []
            }],
            group: ['description'],
            order: [[literal('total_revenue'), 'DESC']]
        });

        res.json({ success: true, data: results });
    } catch (err) {
        console.error('getServiceWiseReport Error:', err);
        res.status(500).json({ success: false, message: 'Failed service breakdown' });
    }
};

/**
 * Balance Sheet / Financial Verification
 */
exports.getBalanceSheet = async (req, res) => {
    try {
        const dateWhere = getDateRangeWhere(req.query);
        const { WalletAccount, WalletTransaction } = require('../models');

        // --- 1. REVENUE & RECEIVABLES ---
        // All non-draft/cancelled invoices
        const revenueInvoices = await Invoice.findAll({
            where: { 
                status: { [Op.notIn]: ['Draft', 'Cancelled'] },
                ...dateWhere 
            },
            attributes: [
                [fn('SUM', col('total')), 'total_revenue'],
                [fn('SUM', col('paid_amount')), 'payments_received'],
                [fn('SUM', col('cost_total')), 'total_gov_fees']
            ]
        });
        
        const totalRevenue = parseFloat(revenueInvoices[0]?.dataValues.total_revenue || 0);
        const customerPayments = parseFloat(revenueInvoices[0]?.dataValues.payments_received || 0);
        const outstandingReceivable = totalRevenue - customerPayments;
        
        // --- 2. GOVERNMENT FEES ---
        const invoiceGovFees = parseFloat(revenueInvoices[0]?.dataValues.total_gov_fees || 0);
        
        // Find wallet payments for invoice costs
        const govFeeWalletPayments = await WalletTransaction.sum('amount', {
            where: { 
                reference_type: 'InvoiceCost',
                type: 'Expense',
                direction: 'Out',
                ...dateWhere
            }
        });
        const walletGovFees = parseFloat(govFeeWalletPayments || 0);
        const pendingGovFees = invoiceGovFees - walletGovFees;

        // --- 3. EXPENSES & PAYABLES ---
        const expenseRecords = await Expense.findAll({
            where: { 
                status: { [Op.notIn]: ['Cancelled'] },
                ...dateWhere
            },
            attributes: [
                [fn('SUM', col('amount')), 'total_expense'],
                [fn('SUM', col('paid_amount')), 'paid_expense']
            ]
        });
        const totalExpenses = parseFloat(expenseRecords[0]?.dataValues.total_expense || 0);
        const paidExpenses = parseFloat(expenseRecords[0]?.dataValues.paid_expense || 0);
        const outstandingPayables = totalExpenses - paidExpenses;

        // --- 4. PROFIT ---
        const grossProfit = totalRevenue - invoiceGovFees;
        const netProfit = grossProfit - totalExpenses;

        // --- 5. WALLET RECONCILIATION ---
        const wallets = await WalletAccount.findAll();
        const walletReconciliations = await Promise.all(wallets.map(async (wallet) => {
            // Money Received: Income + Transfers In + Manual In
            const moneyReceived = await WalletTransaction.sum('amount', {
                where: { account_id: wallet.id, direction: 'In', ...dateWhere }
            }) || 0;

            // Money Paid: Expenses + Transfers Out + Manual Out
            const moneyPaid = await WalletTransaction.sum('amount', {
                where: { account_id: wallet.id, direction: 'Out', ...dateWhere }
            }) || 0;

            // Compute expected vs actual
            // Actual is simply wallet.balance (assuming no date filter on balance)
            // If date is filtered, it's hard to find exact historical balance without a daily snapshot table.
            // We'll return the system current balance and compute expected based on the filtered inflow/outflow.
            // Opening balance logic: if all-time, it's 0 + all inflows - outflows. 
            // If there's a manual "Opening Balance" txn, we can extract it.
            const openingBalanceTx = await WalletTransaction.findOne({
                where: { account_id: wallet.id, description: 'Opening Balance' }
            });
            const openingBalance = openingBalanceTx ? parseFloat(openingBalanceTx.amount) : 0;
            
            const expectedBalance = openingBalance + parseFloat(moneyReceived) - parseFloat(moneyPaid);
            const actualBalance = parseFloat(wallet.balance || 0);
            const diff = expectedBalance - actualBalance;

            return {
                wallet_name: wallet.name,
                opening_balance: openingBalance,
                money_received: parseFloat(moneyReceived),
                money_paid: parseFloat(moneyPaid),
                expected_balance: expectedBalance,
                actual_balance: actualBalance,
                difference: diff,
                matched: Math.abs(diff) < 0.01
            };
        }));

        const totalWalletBalance = walletReconciliations.reduce((acc, w) => acc + w.actual_balance, 0);
        const totalOpeningBalance = walletReconciliations.reduce((acc, w) => acc + w.opening_balance, 0);

        // --- 6. AUDIT & ERROR DETECTION ---
        // Duplicates: Group by customer_id, invoice_number, total, created_at (day) having count > 1
        // We'll do a simpler check: same customer, same total amount within a week, or exact same invoice number
        const duplicatesQuery = await Invoice.findAll({
            attributes: ['invoice_number', 'customer_id', 'total', 'created_at', [fn('COUNT', col('id')), 'count']],
            group: ['invoice_number', 'customer_id', 'total', 'created_at'],
            having: literal('COUNT(id) > 1')
        });
        const duplicateInvoices = duplicatesQuery.map(d => ({
            invoice_number: d.invoice_number,
            amount: d.total,
            date: d.created_at
        }));

        // Double Entry Check
        const totalDebits = totalRevenue + paidExpenses + walletGovFees + outstandingReceivable;
        const totalCredits = customerPayments + totalExpenses + invoiceGovFees + outstandingPayables;
        const doubleEntryStatus = Math.abs(totalDebits - totalCredits) < 0.01;

        res.json({
            success: true,
            data: {
                revenue_control: {
                    total_revenue: totalRevenue,
                    payments_received: customerPayments,
                    outstanding_receivable: outstandingReceivable,
                    matched: Math.abs(totalRevenue - (customerPayments + outstandingReceivable)) < 0.01
                },
                cost_control: {
                    gov_fees_invoices: invoiceGovFees,
                    gov_fees_paid: walletGovFees,
                    pending_gov_fees: pendingGovFees,
                    matched: Math.abs(invoiceGovFees - (walletGovFees + pendingGovFees)) < 0.01
                },
                expense_control: {
                    total_expenses: totalExpenses,
                    expenses_paid: paidExpenses,
                    outstanding_payables: outstandingPayables,
                    matched: Math.abs(totalExpenses - (paidExpenses + outstandingPayables)) < 0.01
                },
                profit_calculation: {
                    gross_profit: grossProfit,
                    net_profit: netProfit
                },
                wallets: walletReconciliations,
                business_position: {
                    wallet_balances: totalWalletBalance,
                    receivables: outstandingReceivable,
                    payables: outstandingPayables,
                    expected_value: totalWalletBalance + outstandingReceivable - outstandingPayables,
                    calculated_value: totalOpeningBalance + totalRevenue - invoiceGovFees - totalExpenses,
                    difference: (totalWalletBalance + outstandingReceivable - outstandingPayables) - (totalOpeningBalance + totalRevenue - invoiceGovFees - totalExpenses)
                },
                audit: {
                    duplicate_invoices: duplicateInvoices,
                    double_entry: {
                        total_debits: totalDebits,
                        total_credits: totalCredits,
                        balanced: doubleEntryStatus
                    }
                }
            }
        });

    } catch (err) {
        console.error('getBalanceSheet Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch balance sheet' });
    }
};
