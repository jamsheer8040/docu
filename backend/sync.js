require('dotenv').config();
const sequelize = require('./config/database');

// Import ALL models to register them with Sequelize
const User = require('./models/User');
const WalletAccount = require('./models/WalletAccount');
const WalletTransaction = require('./models/WalletTransaction');
const Customer = require('./models/Customer');
const Document = require('./models/Document');
const ServiceType = require('./models/ServiceType');
const ServiceOrder = require('./models/ServiceOrder');
const Invoice = require('./models/Invoice');
const InvoiceItem = require('./models/InvoiceItem');
const Expense = require('./models/Expense');

// Re-register associations just in case
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

async function syncDB() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');
    
    // Check tables again
    const [results] = await sequelize.query("SHOW TABLES");
    console.log("Current Tables in Database:");
    console.log(results);
    
    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database or sync:', error);
    process.exit(1);
  }
}

syncDB();
