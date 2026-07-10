const sequelize = require('../config/database');
const { Sequelize } = require('sequelize');
const path = require('path');

console.log('[Models] Starting initialization with absolute paths...');

// 1. User & Role
const User = require(path.join(__dirname, 'User.js'));
const Role = require(path.join(__dirname, 'Role.js'));
console.log('  Loaded: User, Role');

// 2. Customer
const Customer = require(path.join(__dirname, 'Customer.js'));
console.log('  Loaded: Customer');

// 3. Document & DocumentType
const Document = require(path.join(__dirname, 'Document.js'));
const DocumentType = require(path.join(__dirname, 'DocumentType.js'));
console.log('  Loaded: Document, DocumentType');

// 4. Wallet
const WalletAccount = require(path.join(__dirname, 'WalletAccount.js'));
console.log('  Loaded: WalletAccount');

const WalletTransaction = require(path.join(__dirname, 'WalletTransaction.js'));
console.log('  Loaded: WalletTransaction');

// 5. Service
const ServiceType = require(path.join(__dirname, 'ServiceType.js'));
console.log('  Loaded: ServiceType');

const ServiceOrder = require(path.join(__dirname, 'ServiceOrder.js'));
console.log('  Loaded: ServiceOrder');

// 6. Invoice
const Invoice = require(path.join(__dirname, 'Invoice.js'));
console.log('  Loaded: Invoice');

const InvoiceItem = require(path.join(__dirname, 'InvoiceItem.js'));
console.log('  Loaded: InvoiceItem');

// 7. Expense
const Expense = require(path.join(__dirname, 'Expense.js'));
console.log('  Loaded: Expense');

// 8. System Config
const SystemConfig = require(path.join(__dirname, 'SystemConfig.js'));
console.log('  Loaded: SystemConfig');

// Define Associations
User.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });

User.belongsToMany(Customer, { through: 'user_customers', foreignKey: 'user_id', otherKey: 'customer_id', as: 'LinkedCustomers' });
Customer.belongsToMany(User, { through: 'user_customers', foreignKey: 'customer_id', otherKey: 'user_id', as: 'LinkedUsers' });

WalletTransaction.belongsTo(WalletAccount, { foreignKey: 'account_id' });
WalletAccount.hasMany(WalletTransaction, { foreignKey: 'account_id' });

Document.belongsTo(Customer, { foreignKey: 'customer_id' });
Customer.hasMany(Document, { foreignKey: 'customer_id' });

Document.belongsTo(DocumentType, { foreignKey: 'document_type_id', constraints: false });
DocumentType.hasMany(Document, { foreignKey: 'document_type_id', constraints: false });

ServiceOrder.belongsTo(Customer, { foreignKey: 'customer_id' });
Customer.hasMany(ServiceOrder, { foreignKey: 'customer_id' });

ServiceOrder.belongsTo(ServiceType, { foreignKey: 'service_type_id' });
ServiceType.hasMany(ServiceOrder, { foreignKey: 'service_type_id' });

Invoice.belongsTo(Customer, { foreignKey: 'customer_id' });
Customer.hasMany(Invoice, { foreignKey: 'customer_id' });

Invoice.belongsTo(ServiceOrder, { foreignKey: 'service_order_id', constraints: false });
ServiceOrder.hasOne(Invoice, { foreignKey: 'service_order_id', constraints: false });

Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });

Expense.belongsTo(WalletAccount, { foreignKey: 'account_id' });
WalletAccount.hasMany(Expense, { foreignKey: 'account_id' });

console.log('[Models] All associations defined.');

// Export Database Object
const db = {
  sequelize,
  Sequelize,
  User,
  Role,
  Customer,
  Document,
  DocumentType,
  WalletAccount,
  WalletTransaction,
  ServiceType,
  ServiceOrder,
  Invoice,
  InvoiceItem,
  Expense,
  SystemConfig
};

module.exports = db;
