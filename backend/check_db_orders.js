const { ServiceOrder, SalesOrderItem } = require('./models');

async function run() {
  const sois = await SalesOrderItem.findAll({ raw: true });
  console.log('SalesOrderItems:', sois.map(i => ({ id: i.id, service_order_id: i.service_order_id, status: i.status })));

  const sos = await ServiceOrder.findAll({ raw: true });
  console.log('ServiceOrders:', sos.map(s => ({ id: s.id, status: s.status, started_at: s.started_at })));
}
run();
