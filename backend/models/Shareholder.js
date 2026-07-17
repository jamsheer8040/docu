const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Shareholder = sequelize.define('Shareholder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  shareholder_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  mobile: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  nationality: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  identity_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  bank_details: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ownership_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  joining_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    allowNull: false,
    defaultValue: 'Active'
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
  tableName: 'shareholders',
  timestamps: true,
  paranoid: true, // soft deletes
  indexes: [
    {
      unique: true,
      fields: ['shareholder_id', 'tenant_id']
    }
  ]
});

module.exports = Shareholder;
