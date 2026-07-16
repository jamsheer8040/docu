const sequelize = require('./config/database');

async function fixDb() {
  const queryInterface = sequelize.getQueryInterface();
  try {
    await queryInterface.removeColumn('invoices', 'payment_status').catch(() => {});
    await queryInterface.removeColumn('invoices', 'invoice_design_id').catch(() => {});
    await queryInterface.removeColumn('invoice_items', 'list_price').catch(() => {});
    await queryInterface.removeColumn('invoice_items', 'service_charge').catch(() => {});
    await queryInterface.removeColumn('invoice_items', 'selling_price').catch(() => {});
    await queryInterface.removeColumn('invoice_items', 'vat_percentage').catch(() => {});
    await queryInterface.removeColumn('invoice_items', 'vat_amount').catch(() => {});
    await queryInterface.removeColumn('invoice_items', 'wallet_id').catch(() => {});
    console.log('Columns dropped.');
    
    // reset SequelizeMeta
    await sequelize.query(`DELETE FROM SequelizeMeta WHERE name = '20260711000002-update-invoicing-module.js'`).catch(() => {});
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
fixDb();
