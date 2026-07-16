const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TenantInvoice = sequelize.define('TenantInvoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  invoice_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('unpaid', 'paid', 'void'),
    allowNull: false,
    defaultValue: 'unpaid'
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'tenant_invoices',
  timestamps: true
});

module.exports = TenantInvoice;
