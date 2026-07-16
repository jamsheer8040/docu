const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceTypePricing = sequelize.define('ServiceTypePricing', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  service_type_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'service_types',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  pricing_type: {
    type: DataTypes.ENUM('Single', 'Normal', 'Prime', 'Prime+'),
    allowNull: false,
    defaultValue: 'Single'
  },
  service_charge: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  selling_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  }
}, {
  tableName: 'service_type_pricings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ServiceTypePricing;
