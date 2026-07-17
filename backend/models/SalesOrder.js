const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SalesOrder = sequelize.define('SalesOrder', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  order_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  order_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  contact_person: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  sales_executive_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  branch: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  customer_reference: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  internal_remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    }
  }
}, {
  tableName: 'sales_orders',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['customer_id'] },
    { unique: true, fields: ['order_number', 'tenant_id'] }
  ]
});

module.exports = SalesOrder;
