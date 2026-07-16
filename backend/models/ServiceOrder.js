const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceOrder = sequelize.define('ServiceOrder', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  customer_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  service_type_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Pending', 'InProgress', 'CompletedInvoicePending', 'CompletedInvoiceCreated', 'Cancelled'),
    defaultValue: 'Pending',
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  criticality: {
    type: DataTypes.ENUM('Normal', 'Moderate', 'Critical'),
    defaultValue: 'Normal',
    allowNull: false
  },
  initial_criticality: {
    type: DataTypes.ENUM('Normal', 'Moderate', 'Critical'),
    defaultValue: 'Normal',
    allowNull: false
  },
  reminder_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
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
  tableName: 'service_orders',
  timestamps: true,
  underscored: true
});

module.exports = ServiceOrder;
