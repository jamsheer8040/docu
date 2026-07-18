const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');
const { TenantHistory } = require('../models');

async function run() {
  console.log('--- STARTING COMPREHENSIVE SCHEMA MIGRATION ---');
  const queryInterface = sequelize.getQueryInterface();

  // Helper to safely add column if it doesn't exist
  const safeAddColumn = async (table, column, definition) => {
    try {
      const tableInfo = await queryInterface.describeTable(table);
      if (!tableInfo[column]) {
        console.log(`Adding column '${column}' to '${table}'...`);
        await queryInterface.addColumn(table, column, definition);
        console.log(`✓ Column '${column}' added successfully.`);
      } else {
        console.log(`✓ Column '${column}' already exists in '${table}'.`);
      }
    } catch (e) {
      console.error(`Error processing '${column}' on '${table}':`, e.message);
    }
  };

  // 1. Add category to document_types
  await safeAddColumn('document_types', 'category', {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Company Document'
  });

  // 2. Add criticality and initial_criticality to service_orders
  await safeAddColumn('service_orders', 'criticality', {
    type: DataTypes.ENUM('Normal', 'Moderate', 'Critical'),
    allowNull: false,
    defaultValue: 'Normal'
  });
  await safeAddColumn('service_orders', 'initial_criticality', {
    type: DataTypes.ENUM('Normal', 'Moderate', 'Critical'),
    allowNull: false,
    defaultValue: 'Normal'
  });

  // 3. Add staff_name to documents
  await safeAddColumn('documents', 'staff_name', {
    type: DataTypes.STRING(255),
    allowNull: true
  });

  // 4. Add paid_amount to expenses
  await safeAddColumn('expenses', 'paid_amount', {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  });

  // 5. Add type to roles
  await safeAddColumn('roles', 'type', {
    type: DataTypes.ENUM('Internal', 'CustomerPortal'),
    allowNull: false,
    defaultValue: 'Internal'
  });

  // 6. Add next_billing_date to tenants
  await safeAddColumn('tenants', 'next_billing_date', {
    type: DataTypes.DATE,
    allowNull: true
  });

  // 7. Sync TenantHistory and Alter tenants status
  try {
    console.log('Syncing TenantHistory table and altering tenants status ENUM...');
    await TenantHistory.sync({ alter: true });
    await sequelize.query(`
      ALTER TABLE tenants 
      MODIFY COLUMN status ENUM('new_registration', 'trial', 'active', 'suspended', 'expired', 'trial_expired', 'cancelled', 'unpaid') 
      NOT NULL DEFAULT 'new_registration';
    `);
    console.log('✓ TenantHistory and status ENUM verified.');
  } catch (e) {
    console.error('Error syncing TenantHistory / status ENUM:', e.message);
  }

  // 8. Add customer_id to users
  await safeAddColumn('users', 'customer_id', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'customers',
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });

  // 9. Alter service_orders status ENUM & update rows
  try {
    console.log('Altering service_orders status ENUM...');
    await sequelize.query(
      `UPDATE service_orders SET status = 'CompletedInvoicePending' WHERE status = 'PendingInvoice'`
    );
    await sequelize.query(
      `UPDATE service_orders SET status = 'CompletedInvoiceCreated' WHERE status = 'Completed'`
    );
    
    // Step 1: Temporarily modify status ENUM to include both space and no-space variants to avoid truncation
    await sequelize.query(
      `ALTER TABLE service_orders 
       MODIFY COLUMN status 
       ENUM('Pending','InProgress','In Progress','CompletedInvoicePending','CompletedInvoiceCreated','Cancelled') 
       NOT NULL DEFAULT 'Pending'`
    );

    // Step 2: Migrate any 'InProgress' value to 'In Progress'
    await sequelize.query(
      `UPDATE service_orders SET status = 'In Progress' WHERE status = 'InProgress'`
    );

    // Step 3: Set status ENUM to the final clean set matching the frontend and backend models
    await sequelize.query(
      `ALTER TABLE service_orders 
       MODIFY COLUMN status 
       ENUM('Pending','In Progress','CompletedInvoicePending','CompletedInvoiceCreated','Cancelled') 
       NOT NULL DEFAULT 'Pending'`
    );
    
    console.log('✓ Service_orders status ENUM verified and migrated to "In Progress".');
  } catch (e) {
    console.error('Error altering service_orders status ENUM:', e.message);
  }

  console.log('--- SCHEMA MIGRATION COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

run();
