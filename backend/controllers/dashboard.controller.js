const { Op } = require('sequelize');
const Customer = require('../models/Customer');
const Document = require('../models/Document');
const DocumentType = require('../models/DocumentType');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const ServiceOrder = require('../models/ServiceOrder');
const sequelize = require('../config/database');

/**
 * Get Aggregated Dashboard Statistics
 */
exports.getStats = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { customer_id } = req.query;
    const whereDoc = {};
    const whereInvoice = { status: 'Paid', created_at: { [Op.between]: [startOfMonth, endOfMonth] } };
    const whereExpense = { status: 'Paid', created_at: { [Op.between]: [startOfMonth, endOfMonth] } };
    const whereService = { status: { [Op.in]: ['Pending', 'InProgress'] } };

    if (customer_id) {
      whereDoc.customer_id = customer_id;
      whereInvoice.customer_id = customer_id;
      whereService.customer_id = customer_id;
    }

    if (req.user?.Role?.type === 'CustomerPortal') {
      const userCustomerIds = req.user.LinkedCustomers?.map(c => c.id) || [];
      if (customer_id && !userCustomerIds.includes(parseInt(customer_id))) {
        whereDoc.customer_id = { [Op.in]: [] };
        whereInvoice.customer_id = { [Op.in]: [] };
        whereService.customer_id = { [Op.in]: [] };
      } else if (!customer_id) {
        whereDoc.customer_id = { [Op.in]: userCustomerIds };
        whereInvoice.customer_id = { [Op.in]: userCustomerIds };
        whereService.customer_id = { [Op.in]: userCustomerIds };
      }
    }

    // Parallel execution for performance
    const [
      totalCustomers,
      activeDocuments,
      expiringSoon,
      criticalDocuments,
      monthlyRevenue,
      monthlyCost,
      activeServiceOrders
    ] = await Promise.all([
      Customer.count({ where: { is_active: true } }), // Note: CustomerPortal users usually shouldn't see total customers, but we'll leave it or set to LinkedCustomers length
      Document.count({ where: whereDoc }),
      Document.count({ where: { ...whereDoc, expiry_date: { [Op.between]: [new Date(), thirtyDaysFromNow] } } }),
      Document.count({ where: { ...whereDoc, expiry_date: { [Op.between]: [new Date(), sevenDaysFromNow] } } }),
      Invoice.sum('total', { where: whereInvoice }),
      Expense.sum('amount', { where: whereExpense }),
      ServiceOrder.count({ where: whereService })
    ]);

    const revenue = parseFloat(monthlyRevenue || 0);
    const cost = parseFloat(monthlyCost || 0);

    res.json({
      success: true,
      data: {
        total_customers: totalCustomers,
        active_documents: activeDocuments,
        expiring_soon: expiringSoon,
        critical_count: criticalDocuments,
        monthly_revenue: revenue,
        monthly_cost: cost,
        monthly_profit: revenue - cost,
        active_service_orders: activeServiceOrders
      }
    });
  } catch (err) {
    console.error('Dashboard Stats Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics' });
  }
};

/**
 * Get Recent Activity (Invoices & Expiring Docs)
 */
exports.getRecentActivity = async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);

    const { customer_id } = req.query;
    const whereInvoice = {};
    const whereDoc = { expiry_date: { [Op.lte]: thirtyDaysFromNow } };

    if (customer_id) {
      whereInvoice.customer_id = customer_id;
      whereDoc.customer_id = customer_id;
    }

    if (req.user?.Role?.type === 'CustomerPortal') {
      const userCustomerIds = req.user.LinkedCustomers?.map(c => c.id) || [];
      if (customer_id && !userCustomerIds.includes(parseInt(customer_id))) {
        whereInvoice.customer_id = { [Op.in]: [] };
        whereDoc.customer_id = { [Op.in]: [] };
      } else if (!customer_id) {
        whereInvoice.customer_id = { [Op.in]: userCustomerIds };
        whereDoc.customer_id = { [Op.in]: userCustomerIds };
      }
    }

    const [recentInvoices, expiringDocuments] = await Promise.all([
      Invoice.findAll({
        limit: 5,
        where: whereInvoice,
        order: [['created_at', 'DESC']],
        include: [{ model: Customer, attributes: ['name', 'phone_whatsapp'] }]
      }),
      Document.findAll({
        where: whereDoc,
        order: [['expiry_date', 'ASC']],
        include: [
          { model: Customer, attributes: ['name', 'phone_whatsapp'] },
          { model: DocumentType, attributes: ['name'] }
        ]
      })
    ]);

    // Format expiring docs to include days remaining
    const formattedExpiring = expiringDocuments.map(doc => {
        const diff = new Date(doc.expiry_date) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return {
            ...doc.toJSON(),
            days_remaining: days
        };
    });

    res.json({
      success: true,
      data: {
        recent_invoices: recentInvoices,
        expiring_documents: formattedExpiring
      }
    });
  } catch (err) {
    console.error('Recent Activity Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch recent activity' });
  }
};
