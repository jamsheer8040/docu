const { Customer, SalesOrder } = require('./models');

async function run() {
  const customers = await Customer.findAll();
  console.log('Customers:', customers.map(c => c.toJSON()));
}
run();
