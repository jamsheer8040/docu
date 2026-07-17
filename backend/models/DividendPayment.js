const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DividendPayment = sequelize.define('DividendPayment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  distribution_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'dividend_distributions',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  method: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  wallet_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'wallet_accounts',
      key: 'id'
    }
  },
  reference_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tenants',
      key: 'id'
    }
  }
}, {
  tableName: 'dividend_payments',
  timestamps: true
});

module.exports = DividendPayment;
