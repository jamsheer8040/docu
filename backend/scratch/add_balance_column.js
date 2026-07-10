const sequelize = require('../config/database');

async function migrate() {
  try {
    console.log('Adding "balance" column to wallet_accounts table...');
    await sequelize.query('ALTER TABLE wallet_accounts ADD COLUMN balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER is_active;');
    console.log('Column added successfully.');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('Column "balance" already exists.');
      process.exit(0);
    } else {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  }
}

migrate();
