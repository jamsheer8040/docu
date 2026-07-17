const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CapitalTransaction = sequelize.define('CapitalTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  shareholder_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'shareholders',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('Contribution', 'Refund', 'Advance', 'Adjustment'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  attachment_url: {
    type: DataTypes.STRING(1024),
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
  tableName: 'capital_transactions',
  timestamps: true
});

module.exports = CapitalTransaction;
