'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('wallet_transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      account_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'wallet_accounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('Transfer', 'Income', 'Expense', 'Manual'),
        allowNull: false
      },
      direction: {
        type: Sequelize.ENUM('In', 'Out'),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      balance_after: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      reference_id: {
        type: Sequelize.BIGINT, // Using BIGINT as many refs (Invoices, Expenses) are BIGINT
        allowNull: true
      },
      reference_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('wallet_transactions', ['account_id']);
    await queryInterface.addIndex('wallet_transactions', ['created_at']);
    await queryInterface.addIndex('wallet_transactions', ['reference_id', 'reference_type']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('wallet_transactions');
  }
};
