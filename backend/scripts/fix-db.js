require('dotenv').config();
const sequelize = require('../config/database');

// Import models
const User = require('../models/User');
const WalletAccount = require('../models/WalletAccount');
const WalletTransaction = require('../models/WalletTransaction');
const Customer = require('../models/Customer');
const Document = require('../models/Document');
const ServiceType = require('../models/ServiceType');
const ServiceOrder = require('../models/ServiceOrder');
const Invoice = require('../models/Invoice');
const InvoiceItem = require('../models/InvoiceItem');
const Expense = require('../models/Expense');

// Re-define associations (explicitly)
WalletTransaction.belongsTo(WalletAccount, { foreignKey: 'account_id' });
WalletAccount.hasMany(WalletTransaction, { foreignKey: 'account_id' });
Document.belongsTo(Customer, { foreignKey: 'customer_id' });
Customer.hasMany(Document, { foreignKey: 'customer_id' });
ServiceOrder.belongsTo(Customer, { foreignKey: 'customer_id' });
Customer.hasMany(ServiceOrder, { foreignKey: 'customer_id' });
ServiceOrder.belongsTo(ServiceType, { foreignKey: 'service_type_id' });
ServiceType.hasMany(ServiceOrder, { foreignKey: 'service_type_id' });
Invoice.belongsTo(Customer, { foreignKey: 'customer_id' });
Customer.hasMany(Invoice, { foreignKey: 'customer_id' });
Invoice.belongsTo(ServiceOrder, { foreignKey: 'service_order_id' });
ServiceOrder.hasOne(Invoice, { foreignKey: 'service_order_id' });
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });
Expense.belongsTo(WalletAccount, { foreignKey: 'account_id' });
WalletAccount.hasMany(Expense, { foreignKey: 'account_id' });

async function fix() {
  try {
    console.log('--- DB Sync Start ---');
    await sequelize.authenticate();
    console.log('Connected to DB...');
    
    // Attempting to sync specific missing tables individually to isolate errors
    console.log('Syncing ServiceOrder...');
    await ServiceOrder.sync({ alter: true });
    
    console.log('Syncing Invoice...');
    await Invoice.sync({ alter: true });
    
    console.log('Syncing InvoiceItem...');
    await InvoiceItem.sync({ alter: true });
    
    console.log('Syncing Expense...');
    await Expense.sync({ alter: true });
    
    console.log('--- All Syncs Completed ---');
    process.exit(0);
  } catch (err) {
    console.error('--- SYNC ERROR ---');
    console.error(err);
    if (err.errors) {
        err.errors.forEach(e => console.error(`Detail: ${e.message}`));
    }
    process.exit(1);
  }
}

fix();
