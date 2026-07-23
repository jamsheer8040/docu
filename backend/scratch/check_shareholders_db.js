const sequelize = require('../config/database');

async function main() {
  try {
    const [results] = await sequelize.query('SHOW INDEX FROM shareholders');
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

main();
