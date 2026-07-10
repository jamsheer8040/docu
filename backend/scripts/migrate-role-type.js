/**
 * Migration: Add type column to roles table
 */
const sequelize = require('../config/database');

async function migrate() {
  try {
    console.log('[Role Type Migration] Adding type column to roles...');
    await sequelize.query(`
      ALTER TABLE roles 
      ADD COLUMN IF NOT EXISTS type 
        ENUM('Internal', 'CustomerPortal') NOT NULL DEFAULT 'Internal'
    `);
    console.log('[Role Type Migration] Done ✓');
  } catch (err) {
    console.error('[Role Type Migration] FAILED:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();
