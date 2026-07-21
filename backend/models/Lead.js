const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  company_name: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('New', 'Contacted', 'Qualified', 'Lost', 'Won'),
    allowNull: false,
    defaultValue: 'New'
  },
  source: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  service_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  whatsapp_clicks: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  converted_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  converted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  whatsapp_clicks: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'leads',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Lead;
