const { ServiceOrder, Invoice, SalesOrderItem } = require('../models');

async function run() {
  console.log('--- RECONCILING EMPTY STATUSES ---');
  try {
    const orders = await ServiceOrder.findAll();
    for (const order of orders) {
      if (!order.status || order.status === '') {
        console.log(`Reconciling Service Order #${order.id}...`);
        
        const invoice = await Invoice.findOne({ where: { service_order_id: order.id } });
        let correctStatus = 'In Progress';
        
        if (invoice) {
          correctStatus = 'CompletedInvoiceCreated';
        } else if (order.completed_at) {
          correctStatus = 'CompletedInvoicePending';
        } else if (order.started_at) {
          correctStatus = 'In Progress';
        } else {
          correctStatus = 'Pending';
        }
        
        console.log(`Setting Service Order #${order.id} status to: "${correctStatus}"`);
        await order.update({ status: correctStatus });

        // Link and sync SalesOrderItem
        const salesOrderItem = await SalesOrderItem.findOne({ where: { service_order_id: order.id } });
        if (salesOrderItem) {
          console.log(`Syncing Sales Order Item #${salesOrderItem.id} status to: "${correctStatus}"`);
          await salesOrderItem.update({ status: correctStatus });
        }
      }
    }

    console.log('Aligning all SalesOrderItems status with their linked ServiceOrders...');
    const allSalesItems = await SalesOrderItem.findAll();
    for (const item of allSalesItems) {
      if (item.service_order_id) {
        const linkedOrder = await ServiceOrder.findByPk(item.service_order_id);
        if (linkedOrder && item.status !== linkedOrder.status) {
          console.log(`Updating SalesOrderItem #${item.id} status to match ServiceOrder #${linkedOrder.id}: "${linkedOrder.status}"`);
          await item.update({ status: linkedOrder.status });
        }
      }
    }

    console.log('Success! DB Statuses fixed.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

run();
