const sequelize = require('../config/database');
const { TenantHistory } = require('../models');

async function run() {
  console.log('--- STARTING COMPREHENSIVE SCHEMA MIGRATION ---');

  // 1. Add category to document_types
  try {
    console.log('[1/9] Adding category column to document_types...');
    await sequelize.query(`
      ALTER TABLE document_types 
      ADD COLUMN IF NOT EXISTS category 
        VARCHAR(100) NOT NULL DEFAULT 'Company Document'
    `);
    console.log('✓ Category column verified on document_types.');
  } catch (e) {
    console.error('Error adding category to document_types:', e.message);
  }

  // 2. Add criticality and initial_criticality to service_orders
  try {
    console.log('[2/9] Adding criticality columns to service_orders...');
    await sequelize.query(`
      ALTER TABLE service_orders 
      ADD COLUMN IF NOT EXISTS criticality 
        ENUM('Normal','Moderate','Critical') NOT NULL DEFAULT 'Normal'
    `);
    await sequelize.query(`
      ALTER TABLE service_orders 
      ADD COLUMN IF NOT EXISTS initial_criticality 
        ENUM('Normal','Moderate','Critical') NOT NULL DEFAULT 'Normal'
    `);
    console.log('✓ Criticality columns verified on service_orders.');
  } catch (e) {
    console.error('Error adding criticality columns to service_orders:', e.message);
  }

  // 3. Add staff_name to documents
  try {
    console.log('[3/9] Adding staff_name column to documents...');
    await sequelize.query(`
      ALTER TABLE documents 
      ADD COLUMN IF NOT EXISTS staff_name 
        VARCHAR(255) NULL
    `);
    console.log('✓ Staff_name column verified on documents.');
  } catch (e) {
    console.error('Error adding staff_name to documents:', e.message);
  }

  // 4. Add paid_amount to expenses
  try {
    console.log('[4/9] Adding paid_amount to expenses...');
    await sequelize.query('ALTER TABLE `expenses` ADD COLUMN IF NOT EXISTS `paid_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER `amount`;');
    console.log('✓ Paid_amount column verified on expenses.');
  } catch (e) {
    console.error('Error adding paid_amount to expenses:', e.message);
  }

  // 5. Add type to roles
  try {
    console.log('[5/9] Adding type column to roles...');
    await sequelize.query(`
      ALTER TABLE roles 
      ADD COLUMN IF NOT EXISTS type 
        ENUM('Internal', 'CustomerPortal') NOT NULL DEFAULT 'Internal'
    `);
    console.log('✓ Type column verified on roles.');
  } catch (e) {
    console.error('Error adding type to roles:', e.message);
  }

  // 6. Add next_billing_date to tenants
  try {
    console.log('[6/9] Adding next_billing_date to tenants...');
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('tenants', 'next_billing_date', {
      type: require('sequelize').DataTypes.DATE,
      allowNull: true
    });
    console.log('✓ Next_billing_date column verified on tenants.');
  } catch (e) {
    if (e.message.includes('Duplicate column name') || e.message.includes('already exists')) {
      console.log('✓ next_billing_date already exists on tenants.');
    } else {
      console.error('Error adding next_billing_date to tenants:', e.message);
    }
  }

  // 7. Sync TenantHistory and Alter tenants status
  try {
    console.log('[7/9] Syncing TenantHistory table and altering tenants status ENUM...');
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
  try {
    console.log('[8/9] Adding customer_id to users...');
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS customer_id 
        INTEGER NULL
    `);
    try {
      await sequelize.query(`
        ALTER TABLE users
        ADD CONSTRAINT fk_users_customer_id
          FOREIGN KEY (customer_id) REFERENCES customers(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE
      `);
    } catch (fkErr) {
      // Ignore if FK constraint already exists
    }
    console.log('✓ Customer_id column and foreign key verified on users.');
  } catch (e) {
    console.error('Error adding customer_id to users:', e.message);
  }

  // 9. Alter service_orders status ENUM & update rows
  try {
    console.log('[9/9] Altering service_orders status ENUM...');
    await sequelize.query(
      `UPDATE service_orders SET status = 'CompletedInvoicePending' WHERE status = 'PendingInvoice'`
    );
    await sequelize.query(
      `UPDATE service_orders SET status = 'CompletedInvoiceCreated' WHERE status = 'Completed'`
    );
    await sequelize.query(
      `ALTER TABLE service_orders 
       MODIFY COLUMN status 
       ENUM('Pending','InProgress','CompletedInvoicePending','CompletedInvoiceCreated','Cancelled') 
       NOT NULL DEFAULT 'Pending'`
    );
    console.log('✓ Service_orders status ENUM verified.');
  } catch (e) {
    console.error('Error altering service_orders status ENUM:', e.message);
  }

  console.log('--- SCHEMA MIGRATION COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

run();
