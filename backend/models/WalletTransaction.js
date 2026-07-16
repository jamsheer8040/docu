const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WalletTransaction = sequelize.define('WalletTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  account_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'wallet_accounts',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('Transfer', 'Income', 'Expense', 'Manual'),
    allowNull: false
  },
  direction: {
    type: DataTypes.ENUM('In', 'Out'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  balance_after: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    description: 'Snapshot of balance after this transaction (computed during write)'
  },
  reference_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  reference_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Invoice, Expense, etc.'
  },
  description: {
    type: DataTypes.STRING(255),
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
  tableName: 'wallet_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['account_id'] },
    { fields: ['created_at'] }
  ]
});

module.exports = WalletTransaction;
