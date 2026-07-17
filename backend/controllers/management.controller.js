const { Op, Sequelize } = require('sequelize');
const {
  Shareholder,
  OwnershipChange,
  CapitalTransaction,
  DividendDeclaration,
  DividendDistribution,
  DividendPayment,
  SystemConfig,
  WalletAccount,
  WalletTransaction,
  User,
  Tenant
} = require('../models');

// Helpers
const getCompanyCapital = async (tenant_id) => {
  const config = await SystemConfig.findOne({
    where: { key: 'proposed_company_capital', tenant_id }
  });
  return config ? parseFloat(config.value) || 0 : 0;
};

// -----------------------------------------------------------------------------
// DASHBOARD
// -----------------------------------------------------------------------------
exports.getDashboardStats = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const companyCapital = await getCompanyCapital(tenant_id);

    const shareholders = await Shareholder.findAll({ where: { tenant_id, status: 'Active' } });
    const totalShareholders = shareholders.length;

    // Sum capital transactions
    const transactions = await CapitalTransaction.findAll({ where: { tenant_id } });
    let totalContributed = 0;
    
    transactions.forEach(t => {
      if (t.type === 'Contribution' || t.type === 'Advance') {
        totalContributed += parseFloat(t.amount);
      } else if (t.type === 'Refund') {
        totalContributed -= parseFloat(t.amount);
      }
    });

    const outstandingCapital = Math.max(0, companyCapital - totalContributed);
    const excessCapital = Math.max(0, totalContributed - companyCapital);

    // Dividends
    const declarations = await DividendDeclaration.findAll({ where: { tenant_id } });
    const totalDividendsDeclared = declarations.reduce((sum, d) => sum + parseFloat(d.dividend_amount), 0);
    
    const payments = await DividendPayment.findAll({ where: { tenant_id } });
    const totalDividendsPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    return res.status(200).json({
      success: true,
      data: {
        proposed_capital: companyCapital,
        total_received: totalContributed,
        outstanding_capital: outstandingCapital,
        excess_capital: excessCapital,
        total_shareholders: totalShareholders,
        dividends_declared: totalDividendsDeclared,
        dividends_paid: totalDividendsPaid
      }
    });
  } catch (error) {
    console.error('getDashboardStats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

// -----------------------------------------------------------------------------
// SHAREHOLDERS
// -----------------------------------------------------------------------------
exports.getShareholders = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const shareholders = await Shareholder.findAll({
      where: { tenant_id },
      include: [
        { model: CapitalTransaction, required: false }
      ],
      order: [['ownership_percentage', 'DESC']]
    });

    const companyCapital = await getCompanyCapital(tenant_id);

    // Calculate dynamic fields
    const enriched = shareholders.map(s => {
      const sh = s.toJSON();
      sh.required_capital = (companyCapital * parseFloat(sh.ownership_percentage)) / 100;
      
      let contributed = 0;
      if (sh.CapitalTransactions) {
        sh.CapitalTransactions.forEach(t => {
          if (t.type === 'Contribution' || t.type === 'Advance') contributed += parseFloat(t.amount);
          if (t.type === 'Refund') contributed -= parseFloat(t.amount);
        });
      }
      sh.contributed_capital = contributed;
      sh.pending_capital = Math.max(0, sh.required_capital - contributed);
      sh.excess_capital = Math.max(0, contributed - sh.required_capital);
      return sh;
    });

    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error('getShareholders Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shareholders' });
  }
};

exports.createShareholder = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const data = { ...req.body, tenant_id };
    
    // Check total ownership
    const existing = await Shareholder.findAll({ where: { tenant_id, status: 'Active' } });
    const currentTotal = existing.reduce((sum, s) => sum + parseFloat(s.ownership_percentage), 0);
    const newTotal = currentTotal + parseFloat(data.ownership_percentage || 0);

    if (newTotal > 100) {
      return res.status(400).json({ success: false, message: 'Total ownership percentage cannot exceed 100%' });
    }

    const shareholder = await Shareholder.create(data);
    res.status(201).json({ success: true, data: shareholder });
  } catch (error) {
    console.error('createShareholder Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create shareholder' });
  }
};

exports.updateShareholder = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const shareholder = await Shareholder.findOne({ where: { id, tenant_id: req.user.tenant_id } });
    
    if (!shareholder) return res.status(404).json({ success: false, message: 'Shareholder not found' });

    // Handle ownership change
    if (data.ownership_percentage !== undefined && parseFloat(data.ownership_percentage) !== parseFloat(shareholder.ownership_percentage)) {
      const companyCapital = await getCompanyCapital(req.user.tenant_id);
      await OwnershipChange.create({
        shareholder_id: shareholder.id,
        previous_percentage: shareholder.ownership_percentage,
        new_percentage: data.ownership_percentage,
        previous_capital_requirement: (companyCapital * parseFloat(shareholder.ownership_percentage)) / 100,
        new_capital_requirement: (companyCapital * parseFloat(data.ownership_percentage)) / 100,
        user_id: req.user.id,
        reason: data.ownership_change_reason || 'Manual Update',
        tenant_id: req.user.tenant_id
      });
    }

    await shareholder.update(data);
    res.status(200).json({ success: true, data: shareholder });
  } catch (error) {
    console.error('updateShareholder Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update shareholder' });
  }
};

// -----------------------------------------------------------------------------
// CAPITAL TRANSACTIONS
// -----------------------------------------------------------------------------
exports.createCapitalTransaction = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const { shareholder_id, type, amount, method, wallet_id, reference_number, remarks, date } = req.body;

    const transaction = await CapitalTransaction.create({
      shareholder_id, type, amount, method, wallet_id, reference_number, remarks, date, tenant_id
    });

    // If wallet provided, record financial transaction
    if (wallet_id) {
      const wallet = await WalletAccount.findOne({ where: { id: wallet_id, tenant_id } });
      if (wallet) {
        if (type === 'Contribution' || type === 'Advance') {
          // Money in
          const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
          await WalletTransaction.create({
            account_id: wallet.id,
            type: 'Income',
            direction: 'In',
            amount: amount,
            balance_after: newBalance,
            reference_type: 'Capital Contribution',
            description: `Capital ${type} from Shareholder #${shareholder_id} (Ref: ${reference_number || 'N/A'})`,
            tenant_id
          });
          await wallet.update({ balance: newBalance });
        } else if (type === 'Refund') {
          // Money out
          const newBalance = parseFloat(wallet.balance) - parseFloat(amount);
          await WalletTransaction.create({
            account_id: wallet.id,
            type: 'Expense',
            direction: 'Out',
            amount: amount,
            balance_after: newBalance,
            reference_type: 'Capital Refund',
            description: `Capital Refund to Shareholder #${shareholder_id} (Ref: ${reference_number || 'N/A'})`,
            tenant_id
          });
          await wallet.update({ balance: newBalance });
        }
      }
    }

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error('createCapitalTransaction Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create capital transaction' });
  }
};

exports.getCapitalTransactions = async (req, res) => {
  try {
    const transactions = await CapitalTransaction.findAll({
      where: { tenant_id: req.user.tenant_id },
      include: [
        { model: Shareholder, attributes: ['id', 'name'] },
        { model: WalletAccount, attributes: ['id', 'name'] }
      ],
      order: [['date', 'DESC'], ['id', 'DESC']]
    });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    console.error('getCapitalTransactions Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch capital transactions' });
  }
};

// -----------------------------------------------------------------------------
// DIVIDENDS
// -----------------------------------------------------------------------------
exports.declareDividend = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const { financial_year, total_profit, dividend_amount, declaration_date, remarks } = req.body;

    const declaration = await DividendDeclaration.create({
      financial_year, total_profit, dividend_amount, declaration_date, remarks, status: 'Declared', tenant_id
    });

    // Auto-distribute based on current ownership
    const shareholders = await Shareholder.findAll({ where: { tenant_id, status: 'Active' } });
    
    for (const sh of shareholders) {
      if (parseFloat(sh.ownership_percentage) > 0) {
        const allocated = (parseFloat(dividend_amount) * parseFloat(sh.ownership_percentage)) / 100;
        await DividendDistribution.create({
          declaration_id: declaration.id,
          shareholder_id: sh.id,
          ownership_percentage: sh.ownership_percentage,
          allocated_amount: allocated,
          paid_amount: 0,
          tenant_id
        });
      }
    }

    res.status(201).json({ success: true, data: declaration });
  } catch (error) {
    console.error('declareDividend Error:', error);
    res.status(500).json({ success: false, message: 'Failed to declare dividend' });
  }
};

exports.getDividends = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const declarations = await DividendDeclaration.findAll({
      where: { tenant_id },
      include: [
        { 
          model: DividendDistribution,
          include: [{ model: Shareholder, attributes: ['id', 'name'] }, { model: DividendPayment }]
        }
      ],
      order: [['declaration_date', 'DESC']]
    });
    res.status(200).json({ success: true, data: declarations });
  } catch (error) {
    console.error('getDividends Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dividends' });
  }
};

exports.payDividend = async (req, res) => {
  try {
    const tenant_id = req.user.tenant_id;
    const { distribution_id, amount, date, method, wallet_id, reference_number, remarks } = req.body;

    const distribution = await DividendDistribution.findOne({
      where: { id: distribution_id, tenant_id },
      include: [DividendDeclaration, Shareholder]
    });

    if (!distribution) return res.status(404).json({ success: false, message: 'Distribution not found' });

    // Validate amount
    const remaining = parseFloat(distribution.allocated_amount) - parseFloat(distribution.paid_amount);
    if (parseFloat(amount) > remaining) {
      return res.status(400).json({ success: false, message: 'Amount exceeds remaining allocated dividend' });
    }

    const payment = await DividendPayment.create({
      distribution_id, amount, date, method, wallet_id, reference_number, remarks, tenant_id
    });

    // Update distribution paid amount
    await distribution.update({ paid_amount: parseFloat(distribution.paid_amount) + parseFloat(amount) });

    // Update declaration status
    const allDistributions = await DividendDistribution.findAll({ where: { declaration_id: distribution.declaration_id } });
    const totalAllocated = allDistributions.reduce((s, d) => s + parseFloat(d.allocated_amount), 0);
    const totalPaid = allDistributions.reduce((s, d) => s + parseFloat(d.paid_amount), 0);
    
    if (totalPaid >= totalAllocated) {
      await DividendDeclaration.update({ status: 'Fully Paid' }, { where: { id: distribution.declaration_id } });
    } else {
      await DividendDeclaration.update({ status: 'Partially Paid' }, { where: { id: distribution.declaration_id } });
    }

    // Wallet transaction
    if (wallet_id) {
      const wallet = await WalletAccount.findOne({ where: { id: wallet_id, tenant_id } });
      if (wallet) {
        const newBalance = parseFloat(wallet.balance) - parseFloat(amount);
        await WalletTransaction.create({
          account_id: wallet.id,
          type: 'Expense',
          direction: 'Out',
          amount: amount,
          balance_after: newBalance,
          reference_type: 'Dividend Payout',
          description: `Dividend Payment to Shareholder #${distribution.Shareholder.id} (Ref: ${reference_number || 'N/A'})`,
          tenant_id
        });
        await wallet.update({ balance: newBalance });
      }
    }

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    console.error('payDividend Error:', error);
    res.status(500).json({ success: false, message: 'Failed to record dividend payment' });
  }
};
