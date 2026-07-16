const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TenantHistory = sequelize.define('TenantHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  old_status: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  new_status: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  plan_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'plans',
      key: 'id'
    }
  }
}, {
  tableName: 'tenant_history',
  timestamps: true,
  updatedAt: false // We only need created_at for history logs
});

module.exports = TenantHistory;
