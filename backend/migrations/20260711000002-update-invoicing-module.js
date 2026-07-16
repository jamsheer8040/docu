'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Update Invoice model
      await queryInterface.changeColumn('invoices', 'status', {
        type: Sequelize.ENUM('Draft', 'Pending Approval', 'Approved', 'Issued', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'),
        defaultValue: 'Draft',
        allowNull: false
      }, { transaction });

      await queryInterface.addColumn('invoices', 'payment_status', {
        type: Sequelize.ENUM('Unpaid', 'Partial', 'Paid'),
        defaultValue: 'Unpaid',
        allowNull: false
      }, { transaction });

      await queryInterface.addColumn('invoices', 'invoice_design_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      }, { transaction });

      // 2. Update InvoiceItem model
      await queryInterface.addColumn('invoice_items', 'list_price', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      }, { transaction });

      await queryInterface.addColumn('invoice_items', 'service_charge', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      }, { transaction });

      await queryInterface.addColumn('invoice_items', 'selling_price', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      }, { transaction });

      await queryInterface.addColumn('invoice_items', 'vat_percentage', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
      }, { transaction });

      await queryInterface.addColumn('invoice_items', 'vat_amount', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      }, { transaction });

      await queryInterface.addColumn('invoice_items', 'wallet_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'wallet_accounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.changeColumn('invoices', 'status', {
        type: Sequelize.ENUM('Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'),
        defaultValue: 'Draft',
        allowNull: false
      }, { transaction });

      await queryInterface.removeColumn('invoices', 'payment_status', { transaction });
      await queryInterface.removeColumn('invoices', 'invoice_design_id', { transaction });

      await queryInterface.removeColumn('invoice_items', 'list_price', { transaction });
      await queryInterface.removeColumn('invoice_items', 'service_charge', { transaction });
      await queryInterface.removeColumn('invoice_items', 'selling_price', { transaction });
      await queryInterface.removeColumn('invoice_items', 'vat_percentage', { transaction });
      await queryInterface.removeColumn('invoice_items', 'vat_amount', { transaction });
      await queryInterface.removeColumn('invoice_items', 'wallet_id', { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
