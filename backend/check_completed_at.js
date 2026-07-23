const { ServiceOrder, Invoice } = require('./models');

async function run() {
  const ids = [11, 12, 14];
  for (const id of ids) {
    const order = await ServiceOrder.findByPk(id);
    const invoice = await Invoice.findOne({ where: { service_order_id: id } });
    console.log(`Order #${id}:`, {
      status: order.status,
      started_at: order.started_at,
      completed_at: order.completed_at,
      invoice_id: invoice ? invoice.id : null,
      invoice_number: invoice ? invoice.invoice_number : null,
      invoice_status: invoice ? invoice.status : null
    });
  }
}
run();
