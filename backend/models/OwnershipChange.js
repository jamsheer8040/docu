const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OwnershipChange = sequelize.define('OwnershipChange', {
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
  previous_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  new_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  previous_capital_requirement: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  new_capital_requirement: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
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
  tableName: 'ownership_changes',
  timestamps: true
});

module.exports = OwnershipChange;
