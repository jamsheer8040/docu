/**
 * Migration: Add customer_id column to users table
 */
const sequelize = require('../config/database');

async function migrate() {
  try {
    console.log('[User Customer Migration] Adding customer_id column to users...');
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS customer_id 
        INTEGER NULL,
      ADD CONSTRAINT fk_users_customer_id
        FOREIGN KEY (customer_id) REFERENCES customers(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
    `);
    console.log('[User Customer Migration] Done ✓');
  } catch (err) {
    console.error('[User Customer Migration] FAILED:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();
