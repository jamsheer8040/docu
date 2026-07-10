const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Customer = require('./Customer');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  type: {
    type: DataTypes.STRING(100),
    allowNull: true // Changed from false to allow transition to document_type_id
  },
  document_type_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'document_types',
      key: 'id'
    }
  },
  doc_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  issue_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  expiry_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  file_path: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  staff_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  reminder_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  days_until_expiry: {
    type: DataTypes.VIRTUAL,
    get() {
      if (!this.expiry_date) return null;
      const today = new Date();
      // Set to midnight to avoid timezone shifts
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(this.expiry_date);
      const diffTime = expiry - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  }
}, {
  tableName: 'documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['expiry_date'] },
    { fields: ['customer_id'] }
  ]
});

module.exports = Document;
