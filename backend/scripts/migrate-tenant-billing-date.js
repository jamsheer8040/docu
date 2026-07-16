const sequelize = require('../config/database');

async function up() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('tenants', 'next_billing_date', {
      type: require('sequelize').DataTypes.DATE,
      allowNull: true
    });
    console.log('Successfully added next_billing_date to tenants table');
  } catch (err) {
    if (err.message.includes('Duplicate column name')) {
      console.log('Column next_billing_date already exists');
    } else {
      console.error('Error adding column:', err);
    }
  } finally {
    process.exit(0);
  }
}

up();
