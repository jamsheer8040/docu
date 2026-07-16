const sequelize = require('./config/database');

async function clean() {
  try { await sequelize.query('ALTER TABLE expenses DROP FOREIGN KEY expenses_ibfk_2'); } catch(e){}
  try { await sequelize.query('ALTER TABLE expenses DROP FOREIGN KEY expenses_ibfk_3'); } catch(e){}
  try { await sequelize.query('ALTER TABLE expenses DROP COLUMN category_id'); } catch(e){}
  try { await sequelize.query('ALTER TABLE expenses DROP COLUMN sub_category_id'); } catch(e){}
  try { await sequelize.query('DROP TABLE expense_categories'); } catch(e){}
  console.log('Cleaned');
  process.exit(0);
}
clean();
