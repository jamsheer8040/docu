const sequelize = require('../config/database');
const { Tenant, TenantHistory } = require('../models');

async function migrate() {
  try {
    console.log('Syncing database to create TenantHistory table...');
    await TenantHistory.sync({ alter: true });

    console.log('Altering tenants status ENUM...');
    await sequelize.query(`
      ALTER TABLE tenants 
      MODIFY COLUMN status ENUM('new_registration', 'trial', 'active', 'suspended', 'expired', 'trial_expired', 'cancelled', 'unpaid') 
      NOT NULL DEFAULT 'new_registration';
    `);

    // Ensure existing tenants have their status updated if needed. Wait, 'trial' and 'active' are fine.
    // If they were 'trial', keep them 'trial'.
    // If they were 'active', keep 'active'.
    
    console.log('Setting existing trials to active so they are not abruptly blocked...');
    await sequelize.query(`
      UPDATE tenants SET status = 'active' WHERE status = 'trial';
    `);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
