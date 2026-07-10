/**
 * Migration: Rename service order stages to new naming convention
 * PendingInvoice       → CompletedInvoicePending
 * Completed            → CompletedInvoiceCreated
 */
const sequelize = require('../config/database');

async function migrate() {
  try {
    console.log('[Migration] Updating existing rows...');
    await sequelize.query(
      `UPDATE service_orders SET status = 'CompletedInvoicePending' WHERE status = 'PendingInvoice'`
    );
    await sequelize.query(
      `UPDATE service_orders SET status = 'CompletedInvoiceCreated' WHERE status = 'Completed'`
    );

    console.log('[Migration] Altering ENUM column...');
    await sequelize.query(
      `ALTER TABLE service_orders 
       MODIFY COLUMN status 
       ENUM('Pending','InProgress','CompletedInvoicePending','CompletedInvoiceCreated','Cancelled') 
       NOT NULL DEFAULT 'Pending'`
    );

    console.log('[Migration] Done. New ENUM: Pending | InProgress | CompletedInvoicePending | CompletedInvoiceCreated | Cancelled');
  } catch (err) {
    console.error('[Migration] FAILED:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();
