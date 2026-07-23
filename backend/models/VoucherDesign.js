const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VoucherDesign = sequelize.define('VoucherDesign', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  voucher_type: {
    type: DataTypes.ENUM('Invoice', 'Sales Order', 'Quotation', 'Payment Receipt', 'Expense Voucher'),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  branch: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  language: {
    type: DataTypes.ENUM('English', 'Arabic', 'Bilingual'),
    defaultValue: 'English',
    allowNull: false
  },
  layout: {
    type: DataTypes.STRING(50),
    defaultValue: 'A4 Portrait',
    allowNull: false
  },
  header_config: {
    type: DataTypes.JSON,
    allowNull: true
  },
  info_config: {
    type: DataTypes.JSON,
    allowNull: true
  },
  table_config: {
    type: DataTypes.JSON,
    allowNull: true
  },
  totals_config: {
    type: DataTypes.JSON,
    allowNull: true
  },
  footer_config: {
    type: DataTypes.JSON,
    allowNull: true
  },
  branding_config: {
    type: DataTypes.JSON,
    allowNull: true
  },
  print_config: {
    type: DataTypes.JSON,
    allowNull: true
  },
  number_format: {
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
  tableName: 'voucher_designs',
  timestamps: true,
  underscored: true
});

module.exports = VoucherDesign;
