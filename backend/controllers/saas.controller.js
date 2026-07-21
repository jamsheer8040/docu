const { Tenant, Plan, TenantInvoice, User, Customer, PromoCode, SystemConfig, sequelize } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/branding';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'saas-logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

exports.upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|svg|webp/;
    const meta = allowed.test(file.mimetype);
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (meta && ext) return cb(null, true);
    cb(new Error('Only images (jpg, png, svg, webp) are allowed.'));
  }
});

/**
 * Super Admin SaaS Dashboard Stats
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const totalTenants = await Tenant.count();
    
    const newRegistrations = await Tenant.count({ where: { status: 'new_registration' } });
    const activeTenants = await Tenant.count({ where: { status: 'active' } });
    const trialUsers = await Tenant.count({ where: { status: 'trial' } });
    const expiredAccounts = await Tenant.count({ where: { status: ['expired', 'trial_expired'] } });
    const suspendedAccounts = await Tenant.count({ where: { status: 'suspended' } });

    // Trial expiring in next 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const { Op } = require('sequelize');
    const trialExpiringSoon = await Tenant.count({
      where: {
        status: 'trial',
        trial_ends_at: { [Op.lte]: threeDaysFromNow, [Op.gte]: new Date() }
      }
    });

    // Calculate Revenues
    const tenants = await Tenant.findAll({
      where: { status: 'active' },
      include: [{ model: Plan }]
    });

    let monthlyRevenue = 0;
    let yearlyRevenue = 0;
    
    tenants.forEach(t => {
      if (t.Plan) {
        if (t.billing_cycle === 'yearly') {
          yearlyRevenue += parseFloat(t.Plan.price_yearly);
        } else {
          monthlyRevenue += parseFloat(t.Plan.price_monthly);
        }
      }
    });

    // Plan Distribution
    const planCounts = await Tenant.findAll({
      attributes: ['plan_id', [sequelize.fn('count', sequelize.col('Tenant.id')), 'count']],
      group: ['plan_id'],
      include: [{ model: Plan, attributes: ['name'] }]
    });

    // Recent sign-ups
    const recentTenants = await Tenant.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{ model: Plan, attributes: ['name'] }]
    });

    res.json({
      success: true,
      data: {
        newRegistrations,
        totalTenants,
        activeTenants,
        trialUsers,
        trialExpiringSoon,
        expiredAccounts,
        suspendedAccounts,
        monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
        yearlyRevenue: parseFloat(yearlyRevenue.toFixed(2)),
        mrr: parseFloat((monthlyRevenue + (yearlyRevenue / 12)).toFixed(2)),
        planDistribution: planCounts.map(pc => ({
          plan_id: pc.plan_id,
          name: pc.Plan ? pc.Plan.name : 'No Plan',
          count: parseInt(pc.get('count'))
        })),
        recentTenants: recentTenants.map(rt => ({
          id: rt.id,
          name: rt.name,
          slug: rt.slug,
          plan: rt.Plan ? rt.Plan.name : 'None',
          status: rt.status,
          created_at: rt.created_at
        }))
      }
    });
  } catch (err) {
    console.error('[SaaS Admin Stats Error]', err);
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

/**
 * List all Tenants with pagination
 */
exports.getTenants = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  try {
    const where = {};
    if (search) {
      const { Op } = require('sequelize');
      where.name = { [Op.like]: `%${search}%` };
    }

    const { rows, count } = await Tenant.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [{ model: Plan }]
    });

    // Fetch user and customer counts for each tenant dynamically
    const tenantData = [];
    for (const tenant of rows) {
      // Temporarily disable global tenant hooks to fetch raw counts
      const userCount = await User.count({ where: { tenant_id: tenant.id } });
      const customerCount = await Customer.count({ where: { tenant_id: tenant.id } });
      
      // Fetch the admin or first user to get the email
      const firstUser = await User.findOne({
        where: { tenant_id: tenant.id },
        order: [['created_at', 'ASC']],
        attributes: ['email']
      });

      tenantData.push({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        email: firstUser ? firstUser.email : 'N/A',
        status: tenant.status,
        trial_ends_at: tenant.trial_ends_at,
        subscription_starts_at: tenant.subscription_starts_at,
        subscription_ends_at: tenant.subscription_ends_at,
        billing_cycle: tenant.billing_cycle,
        Plan: tenant.Plan,
        userCount,
        customerCount,
        created_at: tenant.created_at
      });
    }

    res.json({
      success: true,
      data: {
        tenants: tenantData,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (err) {
    console.error('[SaaS Admin Get Tenants Error]', err);
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

/**
 * Update Tenant subscription plan
 */
exports.updateTenantPlan = async (req, res) => {
  const { id } = req.params;
  const { plan_id, status, billing_cycle, trial_ends_at, subscription_ends_at, subscription_starts_at } = req.body;

  try {
    const tenant = await Tenant.findByPk(id, { include: [{ model: Plan }] });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found.' });
    }
    
    const oldStatus = tenant.status;

    let planChanged = false;
    let oldPlanId = tenant.plan_id;

    if (plan_id !== undefined && plan_id !== oldPlanId) {
      const plan = await Plan.findByPk(plan_id);
      if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });
      tenant.plan_id = plan_id;
      planChanged = true;
    }

    let billingCycleChanged = false;
    if (billing_cycle !== undefined && billing_cycle !== tenant.billing_cycle) {
      tenant.billing_cycle = billing_cycle;
      billingCycleChanged = true;
    }

    // We ignore frontend manual dates if transitioning to active or trial, backend auto-sets them unless specifically provided in a non-status-change edit.
    if (trial_ends_at !== undefined) tenant.trial_ends_at = trial_ends_at;
    if (subscription_ends_at !== undefined) tenant.subscription_ends_at = subscription_ends_at;
    if (subscription_starts_at !== undefined) tenant.subscription_starts_at = subscription_starts_at;

    // Automatic Dates for Trial and Active
    let invoiceToGenerate = null;
    let newStatus = status !== undefined ? status : oldStatus;

    if (status !== undefined && status !== oldStatus) {
      const now = new Date();

      if (status === 'trial' && oldStatus === 'new_registration') {
        tenant.subscription_starts_at = now;
        
        // Fetch global saas_trial_days setting
        const SystemConfig = require('../models').SystemConfig;
        const config = await SystemConfig.findOne({ where: { key: 'saas_trial_days', tenant_id: null } });
        const trialDays = config && config.value ? parseInt(config.value, 10) : 14;

        const expires = new Date();
        expires.setDate(expires.getDate() + trialDays);
        tenant.trial_ends_at = trial_ends_at ? new Date(trial_ends_at) : expires;
        
        // Generate $0 trial invoice
        invoiceToGenerate = { amount: 0, cycle: 'trial' };
        newStatus = 'trial';
      } 
      else if (status === 'active' && (oldStatus === 'trial' || oldStatus === 'trial_expired' || oldStatus === 'new_registration')) {
        tenant.subscription_starts_at = now;
        const expires = new Date(now);
        if (tenant.billing_cycle === 'yearly') {
          expires.setFullYear(expires.getFullYear() + 1);
        } else {
          expires.setMonth(expires.getMonth() + 1);
        }
        tenant.subscription_ends_at = expires;
        tenant.next_billing_date = expires;
        
        // Generate full invoice
        const activePlan = await Plan.findByPk(tenant.plan_id);
        invoiceToGenerate = { 
          amount: tenant.billing_cycle === 'yearly' ? activePlan.price_yearly : activePlan.price_monthly,
          cycle: tenant.billing_cycle
        };
        newStatus = 'active';
      }

      tenant.status = newStatus;
    } else if ((planChanged || billingCycleChanged) && (oldStatus === 'active' || oldStatus === 'unpaid')) {
      // Plan or billing cycle changed mid-cycle without status change
      // Cancel any existing unpaid invoices for this subscription cycle
      await TenantInvoice.update({ status: 'void' }, { where: { tenant_id: tenant.id, status: 'unpaid' } });
      
      const activePlan = await Plan.findByPk(tenant.plan_id);
      const amount = tenant.billing_cycle === 'yearly' ? activePlan.price_yearly : activePlan.price_monthly;
      
      invoiceToGenerate = { amount, cycle: tenant.billing_cycle };
      // Do not change the workspace status to unpaid, let it remain active
      tenant.status = 'active';
    }

    await tenant.save();

    // Auto-generate invoice
    if (invoiceToGenerate && tenant.plan_id) {
      const invoiceCount = await TenantInvoice.count();
      await TenantInvoice.create({
        tenant_id: tenant.id,
        invoice_number: `INV-SAAS-${10000 + invoiceCount + 1}`,
        amount: invoiceToGenerate.amount,
        status: invoiceToGenerate.amount === 0 ? 'paid' : 'unpaid', // $0 invoice is auto paid
        due_date: new Date()
      });
    }
    
    // Log History if status changed
    if (status !== undefined && status !== oldStatus) {
      const { TenantHistory } = require('../models');
      let actionName = 'Status Updated';
      if (oldStatus === 'new_registration' && status === 'trial') actionName = 'Trial Approved';
      if ((oldStatus === 'trial' || oldStatus === 'trial_expired') && status === 'active') actionName = 'Activated & Invoiced';
      
      await TenantHistory.create({
        tenant_id: tenant.id,
        action: actionName,
        old_status: oldStatus,
        new_status: newStatus,
        plan_id: tenant.plan_id
      });
    }

    res.json({ success: true, message: 'Tenant updated successfully.', data: tenant });
  } catch (err) {
    console.error('[SaaS Admin Update Tenant Error]', err);
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

/**
 * Extend Tenant Subscription (Manual or auto)
 */
exports.extendSubscription = async (req, res) => {
  const { id } = req.params;
  const { extension_type, custom_date } = req.body;

  try {
    const tenant = await Tenant.findByPk(id);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found.' });

    let newDate;
    // Determine the base date (if expired, start from now, otherwise from existing end date)
    const now = new Date();
    
    if (tenant.status === 'trial' || tenant.status === 'trial_expired') {
      const baseDate = (tenant.trial_ends_at && tenant.trial_ends_at > now) ? new Date(tenant.trial_ends_at) : now;
      if (extension_type === 'month') {
        baseDate.setMonth(baseDate.getMonth() + 1);
      } else if (extension_type === 'year') {
        baseDate.setFullYear(baseDate.getFullYear() + 1);
      } else if (extension_type === 'custom' && custom_date) {
        baseDate.setTime(new Date(custom_date).getTime());
      } else {
        return res.status(400).json({ success: false, message: 'Invalid extension parameters.' });
      }
      tenant.trial_ends_at = baseDate;
      if (tenant.status === 'trial_expired' && baseDate > now) {
        tenant.status = 'trial';
      }
      newDate = baseDate;
    } else {
      const baseDate = (tenant.subscription_ends_at && tenant.subscription_ends_at > now) ? new Date(tenant.subscription_ends_at) : now;
      if (extension_type === 'month') {
        baseDate.setMonth(baseDate.getMonth() + 1);
      } else if (extension_type === 'year') {
        baseDate.setFullYear(baseDate.getFullYear() + 1);
      } else if (extension_type === 'custom' && custom_date) {
        baseDate.setTime(new Date(custom_date).getTime());
      } else {
        return res.status(400).json({ success: false, message: 'Invalid extension parameters.' });
      }
      tenant.subscription_ends_at = baseDate;
      tenant.next_billing_date = baseDate;
      
      // If they were expired, reactivate them
      if (['expired', 'suspended'].includes(tenant.status) && baseDate > now) {
        tenant.status = 'active'; // or 'unpaid' if we need to generate invoice, but this is a manual extension so we just make it active.
      }
      newDate = baseDate;
    }

    await tenant.save();

    // Log History
    const { TenantHistory } = require('../models');
    await TenantHistory.create({
      tenant_id: tenant.id,
      action: 'Extended Subscription',
      old_status: tenant.status,
      new_status: tenant.status,
      plan_id: tenant.plan_id
    });

    res.json({ success: true, message: 'Subscription extended successfully.', data: { new_date: newDate } });
  } catch (err) {
    console.error('[SaaS Extend Sub Error]', err);
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

/**
 * Toggle Tenant Status (Suspend / Reactivate)
 */
exports.toggleTenantStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // active or suspended

  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  try {
    const tenant = await Tenant.findByPk(id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found.' });
    }

    tenant.status = status;
    await tenant.save();

    res.json({
      success: true,
      message: `Tenant has been ${status === 'active' ? 'activated' : 'suspended'} successfully.`,
      data: tenant
    });
  } catch (err) {
    console.error('[SaaS Admin Toggle Status Error]', err);
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

exports.getTenantHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const { TenantHistory, Plan } = require('../models');
    const history = await TenantHistory.findAll({
      where: { tenant_id: id },
      order: [['created_at', 'DESC']],
      include: [{ model: Plan, attributes: ['name'] }]
    });
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

/**
 * List Plans
 */
exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.findAll({ order: [['price_monthly', 'ASC']] });
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

/**
 * Create a new Plan
 */
exports.createPlan = async (req, res) => {
  const { name, price_monthly, price_yearly, max_users, max_customers, max_documents, max_wallet_accounts, features, is_active } = req.body;

  try {
    const plan = await Plan.create({
      name,
      price_monthly,
      price_yearly,
      max_users,
      max_customers,
      max_documents,
      max_wallet_accounts,
      features: features || [],
      is_active: is_active !== undefined ? is_active : true
    });
    res.status(201).json({ success: true, message: 'Plan created successfully.', data: plan });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

/**
 * Update Plan limits and prices
 */
exports.updatePlan = async (req, res) => {
  const { id } = req.params;
  const { name, price_monthly, price_yearly, max_users, max_customers, max_documents, max_wallet_accounts, features, is_active } = req.body;

  try {
    const plan = await Plan.findByPk(id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });

    if (name !== undefined) plan.name = name;
    if (price_monthly !== undefined) plan.price_monthly = price_monthly;
    if (price_yearly !== undefined) plan.price_yearly = price_yearly;
    if (max_users !== undefined) plan.max_users = max_users;
    if (max_customers !== undefined) plan.max_customers = max_customers;
    if (max_documents !== undefined) plan.max_documents = max_documents;
    if (max_wallet_accounts !== undefined) plan.max_wallet_accounts = max_wallet_accounts;
    if (features !== undefined) plan.features = features;
    if (is_active !== undefined) plan.is_active = is_active;

    await plan.save();
    res.json({ success: true, message: 'Plan updated successfully.', data: plan });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

/**
 * List SaaS Invoices (Billed to tenants)
 */
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await TenantInvoice.findAll({
      order: [['created_at', 'DESC']],
      include: [{ model: Tenant, attributes: ['id', 'name'] }]
    });
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

/**
 * Record payment for Tenant Invoice
 */
exports.payInvoice = async (req, res) => {
  const { id } = req.params;

  try {
    const invoice = await TenantInvoice.findByPk(id, { include: [Tenant] });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    invoice.status = 'paid';
    invoice.paid_at = new Date();
    await invoice.save();

    // Re-activate tenant if it was unpaid
    if (invoice.Tenant && invoice.Tenant.status === 'unpaid') {
      invoice.Tenant.status = 'active';
      await invoice.Tenant.save();
    }

    res.json({ success: true, message: 'Invoice marked as paid.', data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

/**
 * Get Global System Settings for SaaS
 */
exports.getSettings = async (req, res) => {
  try {
    const configs = await SystemConfig.findAll({ where: { tenant_id: null } });
    const settings = {};
    configs.forEach(c => {
      settings[c.key] = c.value;
    });
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

/**
 * Update Global System Settings for SaaS
 */
exports.updateSettings = async (req, res) => {
  const settings = req.body;
  
  try {
    for (const [key, value] of Object.entries(settings)) {
      const existing = await SystemConfig.findOne({ where: { key, tenant_id: null } });
      if (existing) {
        await existing.update({ value: String(value) });
      } else {
        await SystemConfig.create({ key, value: String(value), tenant_id: null });
      }
    }
    
    // We can also fetch the updated configs to return
    const configs = await SystemConfig.findAll({ where: { tenant_id: null } });
    const updatedSettings = {};
    configs.forEach(c => {
      updatedSettings[c.key] = c.value;
    });
    
    res.json({ success: true, message: 'Settings updated successfully.', data: updatedSettings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

/**
 * Upload SaaS Global Logo
 */
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const logoUrl = `/uploads/branding/${req.file.filename}`;
    const existing = await SystemConfig.findOne({ where: { key: 'app_logo', tenant_id: null } });
    if (existing) {
      await existing.update({ value: logoUrl });
    } else {
      await SystemConfig.create({ key: 'app_logo', value: logoUrl, tenant_id: null });
    }

    res.json({ 
      success: true, 
      message: 'SaaS logo uploaded successfully.',
      url: logoUrl
    });
  } catch (err) {
    console.error('[SaaS Controller] Upload Error:', err);
    res.status(500).json({ success: false, message: 'Logo upload failed.' });
  }
};

/**
 * List Promo Codes
 */
exports.getPromoCodes = async (req, res) => {
  try {
    const promoCodes = await PromoCode.findAll({ order: [['created_at', 'DESC']] });
    res.json({ success: true, data: promoCodes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

/**
 * Create Promo Code
 */
exports.createPromoCode = async (req, res) => {
  try {
    const promoCode = await PromoCode.create(req.body);
    res.status(201).json({ success: true, message: 'Promo code created.', data: promoCode });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'Promo code already exists.' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};

/**
 * Update Promo Code
 */
exports.updatePromoCode = async (req, res) => {
  const { id } = req.params;
  try {
    const promoCode = await PromoCode.findByPk(id);
    if (!promoCode) return res.status(404).json({ success: false, message: 'Promo code not found.' });

    await promoCode.update(req.body);
    res.json({ success: true, message: 'Promo code updated.', data: promoCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
};
