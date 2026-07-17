const { Customer, Tenant } = require('../models');

async function main() {
  try {
    const customers = await Customer.findAll({
      include: [{ model: Tenant, attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']]
    });
    
    console.log(`Total customers in DB: ${customers.length}`);
    console.log('--- LATEST 15 CUSTOMERS ---');
    
    customers.slice(0, 15).forEach(c => {
      console.log(`ID: ${c.id} | Name: ${c.name} | Tenant ID: ${c.tenant_id} (${c.Tenant?.name || 'No Tenant'}) | Active: ${c.is_active} | Created: ${c.created_at}`);
    });
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

main();
