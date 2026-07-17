const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DividendDeclaration = sequelize.define('DividendDeclaration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  financial_year: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  total_profit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  dividend_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  declaration_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Declared', 'Partially Paid', 'Fully Paid', 'Cancelled'),
    allowNull: false,
    defaultValue: 'Draft'
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
  tableName: 'dividend_declarations',
  timestamps: true
});

module.exports = DividendDeclaration;
