const sequelize = require('../config/database');
const { Sequelize } = require('sequelize');
const path = require('path');

console.log('[Models] Starting initialization with absolute paths...');

// 0. SaaS Models
const Plan = require(path.join(__dirname, 'Plan.js'));
const Tenant = require(path.join(__dirname, 'Tenant.js'));
const TenantInvoice = require(path.join(__dirname, 'TenantInvoice.js'));
const TenantHistory = require(path.join(__dirname, 'TenantHistory.js'));
console.log('  Loaded: Plan, Tenant, TenantInvoice, TenantHistory');

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

// 3.5 Tax
const Tax = require(path.join(__dirname, 'Tax.js'));
console.log('  Loaded: Tax');

// 4. Wallet
const WalletAccount = require(path.join(__dirname, 'WalletAccount.js'));
console.log('  Loaded: WalletAccount');

const WalletTransaction = require(path.join(__dirname, 'WalletTransaction.js'));
console.log('  Loaded: WalletTransaction');

// 5. Service
const ServiceType = require(path.join(__dirname, 'ServiceType.js'));
console.log('  Loaded: ServiceType');
const ServiceTypePricing = require(path.join(__dirname, 'ServiceTypePricing.js'));
console.log('  Loaded: ServiceTypePricing');

const ServiceOrder = require(path.join(__dirname, 'ServiceOrder.js'));
console.log('  Loaded: ServiceOrder');

// 6. Invoice
const Invoice = require(path.join(__dirname, 'Invoice.js'));
console.log('  Loaded: Invoice');

const InvoiceItem = require(path.join(__dirname, 'InvoiceItem.js'));
console.log('  Loaded: InvoiceItem');

// 7. Expense & Expense Category
const ExpenseType = require(path.join(__dirname, 'ExpenseType.js'));
console.log('  Loaded: ExpenseType');

const ExpenseSubType = require(path.join(__dirname, 'ExpenseSubType.js'));
console.log('  Loaded: ExpenseSubType');

const Expense = require(path.join(__dirname, 'Expense.js'));
console.log('  Loaded: Expense');

// 8. System Config
const SystemConfig = require(path.join(__dirname, 'SystemConfig.js'));
console.log('  Loaded: SystemConfig');

// Define SaaS Associations
Tenant.belongsTo(Plan, { foreignKey: 'plan_id' });
Plan.hasMany(Tenant, { foreignKey: 'plan_id' });

TenantInvoice.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(TenantInvoice, { foreignKey: 'tenant_id' });

TenantHistory.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(TenantHistory, { foreignKey: 'tenant_id' });

// Define Tenant Scoping Associations
User.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(User, { foreignKey: 'tenant_id' });

Role.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(Role, { foreignKey: 'tenant_id' });

Customer.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(Customer, { foreignKey: 'tenant_id' });

Document.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(Document, { foreignKey: 'tenant_id' });

DocumentType.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(DocumentType, { foreignKey: 'tenant_id' });

Tax.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(Tax, { foreignKey: 'tenant_id' });

WalletAccount.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(WalletAccount, { foreignKey: 'tenant_id' });

WalletTransaction.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(WalletTransaction, { foreignKey: 'tenant_id' });

ServiceType.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(ServiceType, { foreignKey: 'tenant_id' });

ServiceOrder.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(ServiceOrder, { foreignKey: 'tenant_id' });

Invoice.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(Invoice, { foreignKey: 'tenant_id' });

InvoiceItem.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(InvoiceItem, { foreignKey: 'tenant_id' });

Expense.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(Expense, { foreignKey: 'tenant_id' });

ExpenseType.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(ExpenseType, { foreignKey: 'tenant_id' });

ExpenseSubType.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(ExpenseSubType, { foreignKey: 'tenant_id' });

SystemConfig.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(SystemConfig, { foreignKey: 'tenant_id' });

// Define Regular Associations
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

ServiceTypePricing.belongsTo(ServiceType, { foreignKey: 'service_type_id' });
ServiceType.hasMany(ServiceTypePricing, { foreignKey: 'service_type_id' });

Invoice.belongsTo(Customer, { foreignKey: 'customer_id' });
Customer.hasMany(Invoice, { foreignKey: 'customer_id' });

Invoice.belongsTo(ServiceOrder, { foreignKey: 'service_order_id', constraints: false });
ServiceOrder.hasOne(Invoice, { foreignKey: 'service_order_id', constraints: false });

Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });

Expense.belongsTo(WalletAccount, { foreignKey: 'account_id' });
WalletAccount.hasMany(Expense, { foreignKey: 'account_id' });

ExpenseType.hasMany(ExpenseSubType, { foreignKey: 'expense_type_id', as: 'SubTypes' });
ExpenseSubType.belongsTo(ExpenseType, { foreignKey: 'expense_type_id', as: 'ParentType' });

Expense.belongsTo(ExpenseSubType, { foreignKey: 'expense_sub_type_id', as: 'SubType' });
ExpenseSubType.hasMany(Expense, { foreignKey: 'expense_sub_type_id' });

console.log('[Models] All associations defined.');

// Add Global Hooks for Automatic Tenant Scoping
const tenantContext = require('../utils/tenantContext');

sequelize.addHook('beforeFind', function(options) {
  const tenantId = tenantContext.getStore();
  if (tenantId !== undefined && tenantId !== null) {
    if (this.rawAttributes && this.rawAttributes.tenant_id) {
      options.where = options.where || {};
      if (options.where.tenant_id === undefined) {
        options.where.tenant_id = tenantId;
      }
    }
  }
});

sequelize.addHook('beforeBulkUpdate', function(options) {
  const tenantId = tenantContext.getStore();
  if (tenantId !== undefined && tenantId !== null) {
    if (this.rawAttributes && this.rawAttributes.tenant_id) {
      options.where = options.where || {};
      if (options.where.tenant_id === undefined) {
        options.where.tenant_id = tenantId;
      }
    }
  }
});

sequelize.addHook('beforeBulkDestroy', function(options) {
  const tenantId = tenantContext.getStore();
  if (tenantId !== undefined && tenantId !== null) {
    if (this.rawAttributes && this.rawAttributes.tenant_id) {
      options.where = options.where || {};
      if (options.where.tenant_id === undefined) {
        options.where.tenant_id = tenantId;
      }
    }
  }
});

sequelize.addHook('beforeValidate', function(instance, options) {
  const tenantId = tenantContext.getStore();
  if (tenantId !== undefined && tenantId !== null) {
    if (instance.constructor.rawAttributes && instance.constructor.rawAttributes.tenant_id && (instance.tenant_id === undefined || instance.tenant_id === null)) {
      instance.tenant_id = tenantId;
    }
  }
});

sequelize.addHook('beforeCount', function(options) {
  const tenantId = tenantContext.getStore();
  if (tenantId !== undefined && tenantId !== null) {
    if (this.rawAttributes && this.rawAttributes.tenant_id) {
      options.where = options.where || {};
      if (options.where.tenant_id === undefined) {
        options.where.tenant_id = tenantId;
      }
    }
  }
});

// Patch Model.aggregate to enforce tenant isolation since it bypasses beforeFind hooks
const originalAggregate = Sequelize.Model.aggregate;
Sequelize.Model.aggregate = async function(field, aggregateFunction, options) {
  options = options || {};
  const tenantId = tenantContext.getStore();
  if (tenantId !== undefined && tenantId !== null) {
    if (this.rawAttributes && this.rawAttributes.tenant_id) {
      options.where = options.where || {};
      if (options.where.tenant_id === undefined) {
        options.where.tenant_id = tenantId;
      }
    }
  }
  return originalAggregate.call(this, field, aggregateFunction, options);
};

// Export Database Object
const db = {
  sequelize,
  Sequelize,
  Plan,
  Tenant,
  TenantInvoice,
  TenantHistory,
  User,
  Role,
  Customer,
  Document,
  DocumentType,
  Tax,
  WalletAccount,
  WalletTransaction,
  ServiceType,
  ServiceTypePricing,
  ServiceOrder,
  Invoice,
  InvoiceItem,
  ExpenseType,
  ExpenseSubType,
  Expense,
  SystemConfig
};

module.exports = db;
