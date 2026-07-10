/**
 * Migration: Add staff_name column to documents table
 */
const sequelize = require('../config/database');

async function migrate() {
  try {
    console.log('[Document Staff Migration] Adding staff_name column to documents...');
    await sequelize.query(`
      ALTER TABLE documents 
      ADD COLUMN IF NOT EXISTS staff_name 
        VARCHAR(255) NULL
    `);
    console.log('[Document Staff Migration] Done ✓');
  } catch (err) {
    console.error('[Document Staff Migration] FAILED:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();
