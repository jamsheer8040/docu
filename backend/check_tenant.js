const { User, Customer, ServiceOrder } = require('./models');

async function run() {
  try {
    const user = await User.findOne({ where: { email: 'ashraf5@gmail.com' } });
    if (!user) {
      console.log('User not found.');
      return process.exit(0);
    }
    console.log('User Tenant:', user.tenant_id);

    const customersCount = await Customer.count({ where: { tenant_id: user.tenant_id } });
    console.log('Customers in Tenant:', customersCount);

    const activeCustomersCount = await Customer.count({ where: { tenant_id: user.tenant_id, is_active: true } });
    console.log('Active Customers in Tenant:', activeCustomersCount);

    const servicesCount = await ServiceOrder.count({ where: { tenant_id: user.tenant_id } });
    console.log('Services in Tenant:', servicesCount);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
