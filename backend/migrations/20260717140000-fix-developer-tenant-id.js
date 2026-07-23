'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Set the Developer Role's tenant_id to NULL so it acts as a global role
    await queryInterface.sequelize.query(
      `UPDATE roles SET tenant_id = NULL WHERE name = 'Developer';`
    );

    // 2. Set the System Developer User's tenant_id to NULL so they get Super Admin privileges
    await queryInterface.sequelize.query(
      `UPDATE users SET tenant_id = NULL WHERE email = 'developer@looppe.com';`
    );

    console.log('Successfully set Developer Role and System Developer User tenant_id to NULL.');
  },

  down: async (queryInterface, Sequelize) => {
    // No-op or revert to default tenant 1 if needed
    await queryInterface.sequelize.query(
      `UPDATE users SET tenant_id = 1 WHERE email = 'developer@looppe.com';`
    );
    await queryInterface.sequelize.query(
      `UPDATE roles SET tenant_id = 1 WHERE name = 'Developer';`
    );
  }
};
