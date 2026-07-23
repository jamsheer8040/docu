const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VoucherDesignAuditLog = sequelize.define('VoucherDesignAuditLog', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  voucher_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  template_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  previous_values: {
    type: DataTypes.JSON,
    allowNull: true
  },
  new_values: {
    type: DataTypes.JSON,
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
  tableName: 'voucher_design_audit_logs',
  timestamps: true,
  underscored: true
});

module.exports = VoucherDesignAuditLog;
