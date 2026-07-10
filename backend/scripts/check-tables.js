const sequelize = require('./config/database');

async function checkTables() {
  try {
    const [results] = await sequelize.query("SHOW TABLES");
    console.log("Existing Tables:");
    console.log(results);
    process.exit(0);
  } catch (err) {
    console.error("Error checking tables:", err);
    process.exit(1);
  }
}

checkTables();
