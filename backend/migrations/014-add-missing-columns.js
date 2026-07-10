'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add document_type_id to documents
    await queryInterface.addColumn('documents', 'document_type_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'document_types',
        key: 'id'
      }
    });

    // Add file_path to documents
    await queryInterface.addColumn('documents', 'file_path', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    // Add paid_amount to invoices
    await queryInterface.addColumn('invoices', 'paid_amount', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00
    });

    // Change invoices status to STRING so it accepts 'Partially Paid'
    await queryInterface.changeColumn('invoices', 'status', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'Draft'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('documents', 'document_type_id');
    await queryInterface.removeColumn('documents', 'file_path');
    await queryInterface.removeColumn('invoices', 'paid_amount');
    await queryInterface.changeColumn('invoices', 'status', {
      type: Sequelize.ENUM('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Draft'
    });
  }
};
