const sequelize = require('../config/database');

async function migrate() {
  try {
    await sequelize.query('ALTER TABLE `expenses` ADD COLUMN `paid_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER `amount`;');
    console.log('Successfully added paid_amount to expenses');
  } catch (error) {
    if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
      console.log('paid_amount already exists in expenses table.');
    } else {
      console.error('Migration failed:', error);
    }
  } finally {
    process.exit(0);
  }
}

migrate();
