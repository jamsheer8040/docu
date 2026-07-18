const { SalesOrder, SalesOrderItem, ServiceOrder, Customer, User, ServiceType, Invoice, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all Sales Orders
 */
exports.getAllSalesOrders = async (req, res) => {
  try {
    const where = {};
    if (req.user && req.user.Role && req.user.Role.type === 'CustomerPortal') {
      const linkedIds = req.user.LinkedCustomers ? req.user.LinkedCustomers.map(c => c.id) : [];
      where.customer_id = { [Op.in]: linkedIds };
    }

    const salesOrders = await SalesOrder.findAll({
      where,
      include: [
        { model: Customer, attributes: ['id', 'name', 'email', 'phone_whatsapp'] },
        { model: User, as: 'SalesExecutive', attributes: ['id', 'name', 'email'] },
        { 
          model: SalesOrderItem, 
          include: [
            { model: ServiceType, attributes: ['id', 'name'] }
          ] 
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: salesOrders });
  } catch (error) {
    console.error('[SalesOrderController] Error getting sales orders:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get single Sales Order
 */
exports.getSalesOrderById = async (req, res) => {
  try {
    const salesOrder = await SalesOrder.findByPk(req.params.id, {
      include: [
        { model: Customer, attributes: ['id', 'name', 'email', 'phone_whatsapp'] },
        { model: User, as: 'SalesExecutive', attributes: ['id', 'name', 'email'] },
        { 
          model: SalesOrderItem, 
          include: [
            { model: ServiceType, attributes: ['id', 'name'] },
            { 
              model: ServiceOrder, 
              attributes: ['id', 'status'],
              include: [
                { model: Invoice, attributes: ['id', 'invoice_number'] }
              ]
            }
          ] 
        }
      ]
    });

    if (!salesOrder) return res.status(404).json({ success: false, message: 'Sales Order not found' });

    // Compute dynamic status for each item based on ServiceOrder
    const computedItems = salesOrder.SalesOrderItems.map(item => {
      const itemData = item.toJSON();
      if (itemData.ServiceOrder) {
        itemData.status = itemData.ServiceOrder.status;
        if (itemData.ServiceOrder.Invoice) {
          itemData.invoice = itemData.ServiceOrder.Invoice;
        }
      }
      return itemData;
    });

    const data = salesOrder.toJSON();
    data.SalesOrderItems = computedItems;

    res.json({ success: true, data });
  } catch (error) {
    console.error('[SalesOrderController] Error getting sales order:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Create new Sales Order
 */
exports.createSalesOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { 
      customer_id, 
      contact_person, 
      sales_executive_id, 
      branch, 
      customer_reference, 
      internal_remarks, 
      items 
    } = req.body;

    // Generate SO Number
    const count = await SalesOrder.count({ transaction });
    const order_number = `SO-${new Date().getFullYear()}${(count + 1).toString().padStart(4, '0')}`;

    const salesOrder = await SalesOrder.create({
      order_number,
      customer_id,
      contact_person,
      sales_executive_id,
      branch,
      customer_reference,
      internal_remarks
    }, { transaction });

    if (items && items.length > 0) {
      const orderItems = items.map(item => ({
        sales_order_id: salesOrder.id,
        service_type_id: item.service_type_id,
        service_name: item.service_name,
        description: item.description,
        quantity: item.quantity || 1,
        estimated_price: item.estimated_price || 0.00,
        expected_processing_time: item.expected_processing_time,
        priority: item.priority || 'Normal',
        status: 'Not Started',
        tenant_id: req.user.tenant_id
      }));

      await SalesOrderItem.bulkCreate(orderItems, { transaction });
    }

    await transaction.commit();
    res.status(201).json({ success: true, data: salesOrder, message: 'Sales Order created successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('[SalesOrderController] Error creating sales order:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message, stack: error.stack });
  }
};

/**
 * Push Service Item to Services Module
 */
exports.pushService = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const itemId = req.params.itemId;
    const item = await SalesOrderItem.findByPk(itemId, {
      include: [{ model: SalesOrder }],
      transaction
    });

    if (!item) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Service Item not found' });
    }

    if (item.service_order_id) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Service has already been pushed' });
    }

    // Create ServiceOrder
    const serviceOrder = await ServiceOrder.create({
      customer_id: item.SalesOrder.customer_id,
      service_type_id: item.service_type_id,
      status: 'Pending',
      notes: `Pushed from Sales Order ${item.SalesOrder.order_number}\nRemarks: ${item.SalesOrder.internal_remarks || ''}\nDescription: ${item.description || ''}`,
      criticality: item.priority,
      initial_criticality: item.priority
    }, { transaction });

    // Link back to item and update status
    await item.update({
      service_order_id: serviceOrder.id,
      status: 'Pending'
    }, { transaction });

    await transaction.commit();
    res.json({ success: true, message: 'Service successfully pushed to execution', service_order_id: serviceOrder.id });
  } catch (error) {
    await transaction.rollback();
    console.error('[SalesOrderController] Error pushing service:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Delete Sales Order
 */
exports.deleteSalesOrder = async (req, res) => {
  try {
    const salesOrder = await SalesOrder.findByPk(req.params.id);
    if (!salesOrder) return res.status(404).json({ success: false, message: 'Sales Order not found' });
    await salesOrder.destroy();
    res.json({ success: true, message: 'Sales Order deleted successfully' });
  } catch (error) {
    console.error('[SalesOrderController] Error deleting sales order:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
