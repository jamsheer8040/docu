const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  plan_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'plans',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('new_registration', 'trial', 'active', 'suspended', 'expired', 'trial_expired', 'cancelled'),
    allowNull: false,
    defaultValue: 'new_registration'
  },
  trial_ends_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  subscription_starts_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  subscription_ends_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  billing_cycle: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    allowNull: true
  },
  next_billing_date: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'tenants',
  timestamps: true
});

module.exports = Tenant;
