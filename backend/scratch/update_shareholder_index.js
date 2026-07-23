const sequelize = require('../config/database');

async function main() {
  try {
    console.log('Dropping unique constraint on shareholder_id...');
    // In MySQL, to drop a unique constraint, we drop the index.
    await sequelize.query('ALTER TABLE shareholders DROP INDEX shareholder_id');
    console.log('Dropped successfully.');

    console.log('Adding new composite unique index...');
    await sequelize.query('ALTER TABLE shareholders ADD UNIQUE KEY shareholder_id_tenant_id_unique (shareholder_id, tenant_id)');
    console.log('Added successfully.');
  } catch (err) {
    console.error('Error modifying database:', err);
  }
  process.exit();
}

main();
