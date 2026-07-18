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

const SalesOrder = require(path.join(__dirname, 'SalesOrder.js'));
console.log('  Loaded: SalesOrder');

const SalesOrderItem = require(path.join(__dirname, 'SalesOrderItem.js'));
console.log('  Loaded: SalesOrderItem');

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

// 7. Management / Shareholder
const Shareholder = require(path.join(__dirname, 'Shareholder.js'));
const OwnershipChange = require(path.join(__dirname, 'OwnershipChange.js'));
const CapitalTransaction = require(path.join(__dirname, 'CapitalTransaction.js'));
const DividendDeclaration = require(path.join(__dirname, 'DividendDeclaration.js'));
const DividendDistribution = require(path.join(__dirname, 'DividendDistribution.js'));
const DividendPayment = require(path.join(__dirname, 'DividendPayment.js'));
console.log('  Loaded: Shareholder, CapitalTransaction, Dividends');

// 8. Voucher Design & Audit Logs
const VoucherDesign = require(path.join(__dirname, 'VoucherDesign.js'));
const VoucherDesignAuditLog = require(path.join(__dirname, 'VoucherDesignAuditLog.js'));
console.log('  Loaded: VoucherDesign, VoucherDesignAuditLog');

// Define SaaS Associations
Tenant.belongsTo(Plan, { foreignKey: 'plan_id' });
Plan.hasMany(Tenant, { foreignKey: 'plan_id' });

// Voucher Design & Audit Scoping
VoucherDesign.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(VoucherDesign, { foreignKey: 'tenant_id' });

VoucherDesignAuditLog.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(VoucherDesignAuditLog, { foreignKey: 'tenant_id' });

VoucherDesignAuditLog.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(VoucherDesignAuditLog, { foreignKey: 'user_id' });

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

SalesOrder.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(SalesOrder, { foreignKey: 'tenant_id' });

SalesOrderItem.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(SalesOrderItem, { foreignKey: 'tenant_id' });

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

Shareholder.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(Shareholder, { foreignKey: 'tenant_id' });

OwnershipChange.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(OwnershipChange, { foreignKey: 'tenant_id' });

CapitalTransaction.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(CapitalTransaction, { foreignKey: 'tenant_id' });

DividendDeclaration.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(DividendDeclaration, { foreignKey: 'tenant_id' });

DividendDistribution.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(DividendDistribution, { foreignKey: 'tenant_id' });

DividendPayment.belongsTo(Tenant, { foreignKey: 'tenant_id' });
Tenant.hasMany(DividendPayment, { foreignKey: 'tenant_id' });

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

SalesOrder.belongsTo(Customer, { foreignKey: 'customer_id' });
Customer.hasMany(SalesOrder, { foreignKey: 'customer_id' });

SalesOrder.belongsTo(User, { foreignKey: 'sales_executive_id', as: 'SalesExecutive' });
User.hasMany(SalesOrder, { foreignKey: 'sales_executive_id' });

SalesOrderItem.belongsTo(SalesOrder, { foreignKey: 'sales_order_id' });
SalesOrder.hasMany(SalesOrderItem, { foreignKey: 'sales_order_id' });

SalesOrderItem.belongsTo(ServiceType, { foreignKey: 'service_type_id' });
ServiceType.hasMany(SalesOrderItem, { foreignKey: 'service_type_id' });

SalesOrderItem.belongsTo(ServiceOrder, { foreignKey: 'service_order_id' });
ServiceOrder.hasOne(SalesOrderItem, { foreignKey: 'service_order_id' });

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

// Management Relations
OwnershipChange.belongsTo(Shareholder, { foreignKey: 'shareholder_id' });
Shareholder.hasMany(OwnershipChange, { foreignKey: 'shareholder_id' });

OwnershipChange.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(OwnershipChange, { foreignKey: 'user_id' });

CapitalTransaction.belongsTo(Shareholder, { foreignKey: 'shareholder_id' });
Shareholder.hasMany(CapitalTransaction, { foreignKey: 'shareholder_id' });

CapitalTransaction.belongsTo(WalletAccount, { foreignKey: 'wallet_id' });
WalletAccount.hasMany(CapitalTransaction, { foreignKey: 'wallet_id' });

DividendDistribution.belongsTo(DividendDeclaration, { foreignKey: 'declaration_id' });
DividendDeclaration.hasMany(DividendDistribution, { foreignKey: 'declaration_id' });

DividendDistribution.belongsTo(Shareholder, { foreignKey: 'shareholder_id' });
Shareholder.hasMany(DividendDistribution, { foreignKey: 'shareholder_id' });

DividendPayment.belongsTo(DividendDistribution, { foreignKey: 'distribution_id' });
DividendDistribution.hasMany(DividendPayment, { foreignKey: 'distribution_id' });

DividendPayment.belongsTo(WalletAccount, { foreignKey: 'wallet_id' });
WalletAccount.hasMany(DividendPayment, { foreignKey: 'wallet_id' });

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
  SalesOrder,
  SalesOrderItem,
  Invoice,
  InvoiceItem,
  ExpenseType,
  ExpenseSubType,
  Expense,
  SystemConfig,
  Shareholder,
  OwnershipChange,
  CapitalTransaction,
  DividendDeclaration,
  DividendDistribution,
  DividendPayment,
  VoucherDesign,
  VoucherDesignAuditLog
};

module.exports = db;
