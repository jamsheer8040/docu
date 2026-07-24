'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create missing table: tenant_history
    await queryInterface.createTable('tenant_history', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: { 
        type: Sequelize.INTEGER, 
        allowNull: false, 
        references: { model: 'tenants', key: 'id' }
      },
      action: { type: Sequelize.STRING(100), allowNull: false },
      old_status: { type: Sequelize.STRING(50), allowNull: true },
      new_status: { type: Sequelize.STRING(50), allowNull: false },
      plan_id: { 
        type: Sequelize.INTEGER, 
        allowNull: true,
        references: { model: 'plans', key: 'id' }
      },
      created_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 2. Create missing table: lead_status_histories
    await queryInterface.createTable('lead_status_histories', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      lead_id: { type: Sequelize.INTEGER, allowNull: false },
      previous_status: { type: Sequelize.STRING(50), allowNull: true },
      new_status: { type: Sequelize.STRING(50), allowNull: false },
      changed_by: { type: Sequelize.INTEGER, allowNull: true },
      update_source: { 
        type: Sequelize.ENUM('Kanban', 'List', 'Details', 'System'), 
        allowNull: false, 
        defaultValue: 'System' 
      },
      created_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 3. Fix ENUMs via raw SQL queries
    // leads.status (Add 'Won')
    await queryInterface.sequelize.query(`
      ALTER TABLE leads 
      MODIFY COLUMN status ENUM('New', 'Contacted', 'Qualified', 'Lost', 'Converted', 'Won') 
      NOT NULL DEFAULT 'New';
    `);

    // service_orders.status (Add CompletedInvoicePending and CompletedInvoiceCreated)
    await queryInterface.sequelize.query(`
      ALTER TABLE service_orders 
      MODIFY COLUMN status ENUM('Pending', 'Assigned', 'In Progress', 'Waiting for Customer', 'On Hold', 'Completed', 'Cancelled', 'CompletedInvoicePending', 'CompletedInvoiceCreated') 
      NOT NULL DEFAULT 'Pending';
    `);

    // sales_order_items.status (Add 'Not Started', 'In Progress')
    await queryInterface.sequelize.query(`
      ALTER TABLE sales_order_items 
      MODIFY COLUMN status ENUM('Not Started', 'Pending', 'In Progress', 'InProgress', 'CompletedInvoicePending', 'CompletedInvoiceCreated', 'Cancelled') 
      NOT NULL DEFAULT 'Pending';
    `);

    // expenses.status (Add 'Partially Paid')
    await queryInterface.sequelize.query(`
      ALTER TABLE expenses 
      MODIFY COLUMN status ENUM('Paid', 'Unpaid', 'Partially Paid') 
      NOT NULL DEFAULT 'Unpaid';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop the created tables
    await queryInterface.dropTable('tenant_history');
    await queryInterface.dropTable('lead_status_histories');

    // Note: Reverting ENUMs in MySQL is risky if the new values are in use.
    // So we just leave the ENUM modifications in the down script.
  }
};
