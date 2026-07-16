'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Remove columns from expenses (which automatically drops foreign keys)
    await queryInterface.removeColumn('expenses', 'sub_category_id');
    await queryInterface.removeColumn('expenses', 'category_id');
    await queryInterface.removeColumn('expenses', 'sub_category');
    await queryInterface.removeColumn('expenses', 'category');

    // 2. Drop the old table
    await queryInterface.dropTable('expense_categories');

    // 3. Create expense_types table
    await queryInterface.createTable('expense_types', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Active', 'Inactive'),
        defaultValue: 'Active'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 4. Create expense_sub_types table
    await queryInterface.createTable('expense_sub_types', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      expense_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'expense_types',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sub_type_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Active', 'Inactive'),
        defaultValue: 'Active'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 5. Add expense_sub_type_id to expenses
    await queryInterface.addColumn('expenses', 'expense_sub_type_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'expense_sub_types',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('expenses', 'expense_sub_type_id');
    await queryInterface.dropTable('expense_sub_types');
    await queryInterface.dropTable('expense_types');
  }
};
