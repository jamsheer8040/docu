const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DividendDistribution = sequelize.define('DividendDistribution', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  declaration_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'dividend_declarations',
      key: 'id'
    }
  },
  shareholder_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'shareholders',
      key: 'id'
    }
  },
  ownership_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  allocated_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  paid_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
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
  tableName: 'dividend_distributions',
  timestamps: true
});

module.exports = DividendDistribution;
