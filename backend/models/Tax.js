const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tax = sequelize.define('Tax', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'taxes',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['name', 'tenant_id'] }
  ]
});

module.exports = Tax;
