require('dotenv').config();
const sequelize = require('../config/database');

async function run() {
  try {
    console.log('Altering service_orders status column...');
    await sequelize.authenticate();
    await sequelize.query("ALTER TABLE service_orders MODIFY COLUMN status ENUM('Pending', 'InProgress', 'PendingInvoice', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending'");
    console.log('Successfully altered column!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to alter column:', err);
    process.exit(1);
  }
}

run();
