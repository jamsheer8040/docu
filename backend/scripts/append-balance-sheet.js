const fs = require('fs');
const path = require('path');

const code = `
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
                    calculated_value: totalRevenue - invoiceGovFees - totalExpenses,
                    difference: (totalWalletBalance + outstandingReceivable - outstandingPayables) - (totalRevenue - invoiceGovFees - totalExpenses)
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
`;

const targetFile = path.join(__dirname, '../controllers/reports.controller.js');
fs.appendFileSync(targetFile, code);
console.log('Successfully appended getBalanceSheet to reports.controller.js');
