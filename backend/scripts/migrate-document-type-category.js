/**
 * Migration: Add category column to document_types table
 */
const sequelize = require('../config/database');

async function migrate() {
  try {
    console.log('[Document Type Category Migration] Adding category column to document_types...');
    await sequelize.query(`
      ALTER TABLE document_types 
      ADD COLUMN IF NOT EXISTS category 
        VARCHAR(100) NOT NULL DEFAULT 'Company Document'
    `);
    console.log('[Document Type Category Migration] Done ✓');
  } catch (err) {
    console.error('[Document Type Category Migration] FAILED:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();
