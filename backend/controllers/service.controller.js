const { ServiceType, ServiceTypePricing, ServiceOrder, Customer, Invoice, InvoiceItem, sequelize } = require('../models/index.js');
const { Op } = require('sequelize');

/**
 * SERVICE TYPES (Catalog)
 */
exports.getServiceTypes = async (req, res, next) => {
  try {
    let { is_active, page = 1, limit = 10, search = '' } = req.query;
    limit = Math.min(parseInt(limit), 100);
    const offset = (page - 1) * limit;

    const where = {};
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (search) where.name = { [Op.like]: `%${search}%` };

    const { count, rows } = await ServiceType.findAndCountAll({ 
      where, 
      include: [{ model: ServiceTypePricing }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']] 
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
    next(err);
  }
};

exports.createServiceType = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { pricing, ...typeData } = req.body;
    const type = await ServiceType.create(typeData, { transaction });
    
    if (pricing && Array.isArray(pricing)) {
      const pricingsToCreate = pricing.map(p => ({
        ...p,
        service_type_id: type.id
      }));
      await ServiceTypePricing.bulkCreate(pricingsToCreate, { transaction });
    }
    
    await transaction.commit();
    const fullType = await ServiceType.findByPk(type.id, { include: [ServiceTypePricing] });
    res.status(201).json({ success: true, data: fullType });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.updateServiceType = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const type = await ServiceType.findByPk(req.params.id);
    if (!type) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Service type not found' });
    }

    const { pricing, ...typeData } = req.body;
    await type.update(typeData, { transaction });

    if (pricing && Array.isArray(pricing)) {
      await ServiceTypePricing.destroy({ where: { service_type_id: type.id }, transaction });
      const pricingsToCreate = pricing.map(p => ({
        ...p,
        service_type_id: type.id
      }));
      await ServiceTypePricing.bulkCreate(pricingsToCreate, { transaction });
    }

    await transaction.commit();
    const fullType = await ServiceType.findByPk(type.id, { include: [ServiceTypePricing] });
    res.json({ success: true, data: fullType });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.deleteServiceType = async (req, res, next) => {
  try {
    const type = await ServiceType.findByPk(req.params.id);
    if (!type) return res.status(404).json({ success: false, message: 'Service type not found' });

    // Check if used in orders
    const count = await ServiceOrder.count({ where: { service_type_id: type.id } });
    if (count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete service type that is linked to existing orders. Deactivate it instead.' 
      });
    }

    await type.destroy();
    res.json({ success: true, message: 'Service type deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * SERVICE ORDERS (Workflow)
 */
exports.getServiceOrders = async (req, res, next) => {
  try {
    let { status, customer_id, criticality, sort, page = 1, limit = 100 } = req.query;
    limit = Math.min(parseInt(limit), 200);
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (customer_id) where.customer_id = customer_id;
    if (criticality) where.criticality = criticality;

    // Criticality sort: Critical=0, Moderate=1, Normal=2
    const order = sort === 'criticality'
      ? [[
          sequelize.literal(`CASE criticality WHEN 'Critical' THEN 0 WHEN 'Moderate' THEN 1 ELSE 2 END`),
          'ASC'
        ], ['created_at', 'DESC']]
      : [['created_at', 'DESC']];

    const { count, rows } = await ServiceOrder.findAndCountAll({
      where,
      include: [
        { model: Customer, attributes: ['id', 'name', 'phone_whatsapp'] },
        { 
          model: ServiceType, 
          attributes: ['id', 'name', 'pricing_mode', 'cost_price'],
          include: [{ model: ServiceTypePricing }]
        },
        { model: Invoice, attributes: ['id', 'invoice_number', 'status'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order
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
    next(err);
  }
};

exports.createServiceOrder = async (req, res, next) => {
  try {
    const { criticality = 'Normal', ...rest } = req.body;
    const order = await ServiceOrder.create({
      ...rest,
      criticality,
      initial_criticality: criticality
    });
    const fullOrder = await ServiceOrder.findByPk(order.id, {
      include: [
        { model: Customer, attributes: ['id', 'name', 'phone_whatsapp'] },
        { 
          model: ServiceType, 
          attributes: ['id', 'name', 'pricing_mode', 'cost_price'],
          include: [{ model: ServiceTypePricing }]
        },
        { model: Invoice, attributes: ['id', 'invoice_number', 'status'] }
      ]
    });
    res.status(201).json({ success: true, data: fullOrder });
  } catch (err) {
    next(err);
  }
};

exports.updateServiceOrderStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { status } = req.body;
    const order = await ServiceOrder.findByPk(req.params.id, {
      include: [
        { model: ServiceType, include: [{ model: ServiceTypePricing }] },
        Customer
      ],
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const oldStatus = order.status;
    const updates = { status };

    // CANCEL VALIDATION: block if active invoice exists
    if (status === 'Cancelled') {
      const invoice = await Invoice.findOne({
        where: { service_order_id: order.id, status: { [Op.ne]: 'Cancelled' } },
        transaction
      });
      if (invoice) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'This service cannot be cancelled because an invoice has already been generated.'
        });
      }
    }

    // TRANSITION LOGIC
    if (oldStatus === 'Pending' && status === 'InProgress') {
      // Start Service
      updates.started_at = new Date();

    } else if (oldStatus === 'InProgress' && status === 'Completed') {
      // Complete Service — check invoice to determine which completed stage
      const invoice = await Invoice.findOne({
        where: { service_order_id: order.id, status: { [Op.ne]: 'Cancelled' } },
        transaction
      });
      updates.status = invoice ? 'CompletedInvoiceCreated' : 'CompletedInvoicePending';
      updates.completed_at = new Date();

    } else if (
      (oldStatus === 'CompletedInvoicePending' || oldStatus === 'CompletedInvoiceCreated') &&
      status === 'InProgress'
    ) {
      // REVERSAL — block if invoice is already processed
      const persistentInvoice = await Invoice.findOne({
        where: {
          service_order_id: order.id,
          status: { [Op.in]: ['Sent', 'Partially Paid', 'Paid'] }
        },
        transaction
      });
      if (persistentInvoice) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Cannot revert this service. Its invoice has already been processed (Sent/Paid).'
        });
      }
      updates.completed_at = null;
    }

    await order.update(updates, { transaction });
    await transaction.commit();

    const updatedOrder = await ServiceOrder.findByPk(order.id, {
      include: [
        { model: Customer, attributes: ['id', 'name', 'phone_whatsapp'] },
        { 
          model: ServiceType, 
          attributes: ['id', 'name', 'pricing_mode', 'cost_price'],
          include: [{ model: ServiceTypePricing }]
        },
        { model: Invoice, attributes: ['id', 'invoice_number', 'status'] }
      ]
    });

    let returnMessage = 'Status updated';
    if (oldStatus === 'InProgress' && status === 'Completed') {
      returnMessage = updatedOrder.status === 'CompletedInvoiceCreated'
        ? 'Service completed — invoice already exists.'
        : 'Service completed — waiting for invoice to be created.';
    }

    res.json({
      success: true,
      data: updatedOrder,
      message: returnMessage
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};


exports.deleteServiceOrder = async (req, res, next) => {
  try {
    const order = await ServiceOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (!['Pending', 'Cancelled'].includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only Pending or Cancelled orders can be deleted.' 
      });
    }

    await order.destroy();
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    next(err);
  }
};

exports.updateServiceOrder = async (req, res, next) => {
  try {
    const order = await ServiceOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (!['Pending', 'InProgress'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only Pending or In Progress service orders can be edited.'
      });
    }

    const linkedInvoice = await Invoice.findOne({
      where: {
        service_order_id: order.id,
        status: { [Op.ne]: 'Cancelled' }
      }
    });

    if (linkedInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit service order once an invoice is created.'
      });
    }

    const { customer_id, service_type_id, notes, criticality } = req.body;
    
    const updates = {};
    if (customer_id !== undefined) updates.customer_id = customer_id;
    if (service_type_id !== undefined) updates.service_type_id = service_type_id;
    if (notes !== undefined) updates.notes = notes;
    if (criticality !== undefined) {
      updates.criticality = criticality;
      updates.initial_criticality = criticality;
    }

    await order.update(updates);

    const fullOrder = await ServiceOrder.findByPk(order.id, {
      include: [
        { model: Customer, attributes: ['id', 'name', 'phone_whatsapp'] },
        { 
          model: ServiceType, 
          attributes: ['id', 'name', 'pricing_mode', 'cost_price'],
          include: [{ model: ServiceTypePricing }]
        },
        { model: Invoice, attributes: ['id', 'invoice_number', 'status'] }
      ]
    });

    res.json({ success: true, data: fullOrder, message: 'Service order updated successfully' });
  } catch (err) {
    next(err);
  }
};

// Helper to generate Invoice Number (INV-YYYY-XXXX)
async function generateInvoiceNumber(transaction) {
  const year = new Date().getFullYear();
  const lastInvoice = await Invoice.findOne({
    where: {
      invoice_number: { [Op.like]: `INV-${year}-%` }
    },
    order: [['invoice_number', 'DESC']],
    transaction
  });

  let nextNum = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoice_number.split('-');
    nextNum = parseInt(parts[2]) + 1;
  }
  
  return `INV-${year}-${nextNum.toString().padStart(4, '0')}`;
}

/**
 * CRITICALITY ESCALATION ENGINE
 * Runs through all active (Pending/InProgress) orders and escalates
 * criticality based on days elapsed since creation.
 */
exports.runEscalation = async (req, res, next) => {
  try {
    const SystemConfig = require('../models/SystemConfig');
    const configs = await SystemConfig.findAll({
      where: {
        key: [
          'svc_escalation_normal_to_moderate_days',
          'svc_escalation_normal_to_critical_days',
          'svc_escalation_moderate_to_critical_days'
        ]
      }
    });

    const cfg = {};
    configs.forEach(c => { cfg[c.key] = parseInt(c.value) || 0; });
    const normalToModerate   = cfg['svc_escalation_normal_to_moderate_days']   ?? 2;
    const normalToCritical   = cfg['svc_escalation_normal_to_critical_days']   ?? 4;
    const moderateToCritical = cfg['svc_escalation_moderate_to_critical_days'] ?? 2;

    // Fetch all active orders
    const activeOrders = await ServiceOrder.findAll({
      where: { status: { [Op.in]: ['Pending', 'InProgress'] } }
    });

    let escalatedCount = 0;
    const now = new Date();

    for (const order of activeOrders) {
      const daysElapsed = Math.floor((now - new Date(order.created_at)) / (1000 * 60 * 60 * 24));
      let newCriticality = order.criticality;
      const init = order.initial_criticality;

      if (init === 'Critical') {
        // Critical stays Critical
        newCriticality = 'Critical';
      } else if (init === 'Moderate') {
        if (daysElapsed >= moderateToCritical) newCriticality = 'Critical';
        else newCriticality = 'Moderate';
      } else { // Normal
        if (daysElapsed >= normalToCritical)       newCriticality = 'Critical';
        else if (daysElapsed >= normalToModerate)  newCriticality = 'Moderate';
        else                                       newCriticality = 'Normal';
      }

      if (newCriticality !== order.criticality) {
        await order.update({ criticality: newCriticality });
        escalatedCount++;
      }
    }

    res.json({ success: true, message: `Escalation complete. ${escalatedCount} order(s) updated.`, escalatedCount });
  } catch (err) {
    next(err);
  }
};

/**
 * GET Criticality Escalation Config
 */
exports.getCriticalityConfig = async (req, res, next) => {
  try {
    const SystemConfig = require('../models/SystemConfig');
    const configs = await SystemConfig.findAll({
      where: {
        key: [
          'svc_escalation_normal_to_moderate_days',
          'svc_escalation_normal_to_critical_days',
          'svc_escalation_moderate_to_critical_days'
        ]
      }
    });
    const result = {};
    configs.forEach(c => { result[c.key] = parseInt(c.value); });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT Criticality Escalation Config
 */
exports.saveCriticalityConfig = async (req, res, next) => {
  try {
    const SystemConfig = require('../models/SystemConfig');
    const keys = [
      'svc_escalation_normal_to_moderate_days',
      'svc_escalation_normal_to_critical_days',
      'svc_escalation_moderate_to_critical_days'
    ];
    for (const key of keys) {
      if (req.body[key] !== undefined) {
        await SystemConfig.update(
          { value: String(parseInt(req.body[key])) },
          { where: { key } }
        );
      }
    }
    res.json({ success: true, message: 'Criticality config saved' });
  } catch (err) {
    next(err);
  }
};

exports.incrementReminderCount = async (req, res, next) => {
  try {
    const order = await ServiceOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (req.user?.Role?.type === 'CustomerPortal') {
      const userCustomerIds = req.user.LinkedCustomers?.map(c => c.id) || [];
      if (!userCustomerIds.includes(parseInt(order.customer_id))) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    order.reminder_count = (order.reminder_count || 0) + 1;
    await order.save();

    res.json({ success: true, reminder_count: order.reminder_count });
  } catch (err) {
    next(err);
  }
};
