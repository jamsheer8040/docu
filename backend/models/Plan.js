const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Plan = sequelize.define('Plan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  price_monthly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  price_yearly: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  max_users: {
    type: DataTypes.INTEGER,
    allowNull: true, // null or -1 can represent unlimited
    defaultValue: 5
  },
  max_customers: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 100
  },
  max_documents: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 200
  },
  max_wallet_accounts: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 3
  },
  features: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'plans',
  timestamps: true
});

module.exports = Plan;
