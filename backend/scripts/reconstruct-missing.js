require('dotenv').config();
const sequelize = require('../config/database');

const WalletAccount = require('../models/WalletAccount');
const Invoice = require('../models/Invoice');
const InvoiceItem = require('../models/InvoiceItem');
const Expense = require('../models/Expense');

// Re-register associations for the script's lifetime
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });
Expense.belongsTo(WalletAccount, { foreignKey: 'account_id' });
WalletAccount.hasMany(Expense, { foreignKey: 'account_id' });

async function reconstruct() {
  try {
    console.log('--- RECONSTRUCTION START ---');
    await sequelize.authenticate();
    console.log('DB Connection Verified.');

    // 1. Force Sync InvoiceItem (Depends on Invoice)
    console.log('Attempting forced sync of InvoiceItem...');
    await InvoiceItem.sync({ force: true });
    console.log('InvoiceItem table created successfully.');

    // 2. Force Sync Expense (Depends on WalletAccount)
    console.log('Attempting forced sync of Expense...');
    await Expense.sync({ force: true });
    console.log('Expense table created successfully.');

    // 3. Final Manifest
    const [results] = await sequelize.query("SHOW TABLES");
    console.log('--- FINAL TABLE MANIFEST ---');
    console.log(results);
    
    process.exit(0);
  } catch (err) {
    console.error('CRITICAL RECONSTRUCTION ERROR:');
    console.error(err.message);
    if (err.parent) console.error(`Raw SQL: ${err.parent.sql}`);
    process.exit(1);
  }
}

reconstruct();
