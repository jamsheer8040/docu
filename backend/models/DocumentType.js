const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocumentType = sequelize.define('DocumentType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Company Document'
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
  tableName: 'document_types',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['name', 'tenant_id'] }
  ]
});

module.exports = DocumentType;
