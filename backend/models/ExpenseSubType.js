const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const ExpenseType = require('./ExpenseType');

class ExpenseSubType extends Model {}

ExpenseSubType.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    expense_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'expense_types',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    sub_type_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        defaultValue: 'Active'
    }
}, {
    sequelize,
    modelName: 'ExpenseSubType',
    tableName: 'expense_sub_types',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = ExpenseSubType;
