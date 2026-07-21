const sequelize = require('./config/database');

async function run() {
  try {
    await sequelize.query('DROP TABLE IF EXISTS sales_order_items;');
    await sequelize.query('DROP TABLE IF EXISTS sales_orders;');
    console.log('Dropped successfully.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
