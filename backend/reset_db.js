const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
);

async function reset() {
  try {
    console.log('--- Database Reset Start ---');
    
    // 1. Disable Check
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('[1/4] Foreign key checks disabled.');

    // 2. Clear All Tables (including migration meta)
    const [results] = await sequelize.query("SHOW TABLES");
    const tables = results.map(r => Object.values(r)[0]);
    
    for (const table of tables) {
      await sequelize.query(`DROP TABLE IF EXISTS ${table}`);
      console.log(`  - Dropped table: ${table}`);
    }
    console.log('[2/4] All tables dropped.');

    // 3. Clear Migration Meta Table specifically if it was somehow missed
    await sequelize.query('DROP TABLE IF EXISTS SequelizeMeta');
    console.log('[3/4] Migration history reset.');

    // 4. Re-enable Check
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('[4/4] Foreign key checks enabled.');

    console.log('--- Database Reset SUCCESS ---');
    console.log('Now run: npx sequelize-cli db:migrate');
    process.exit(0);
  } catch (err) {
    console.error('--- Database Reset FAILED ---');
    console.error(err);
    process.exit(1);
  }
}

reset();
