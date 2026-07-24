'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Update the 'status' ENUM in 'tenants' table
    // In MySQL, to safely update an ENUM, we use a raw query
    await queryInterface.sequelize.query(`
      ALTER TABLE tenants 
      MODIFY COLUMN status ENUM('new_registration', 'trial', 'active', 'suspended', 'expired', 'trial_expired', 'cancelled', 'unpaid') 
      NOT NULL DEFAULT 'new_registration';
    `);

    // 2. Add 'next_billing_date' if it doesn't exist
    const tableInfo = await queryInterface.describeTable('tenants');
    if (!tableInfo.next_billing_date) {
      await queryInterface.addColumn('tenants', 'next_billing_date', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the ENUM (Note: This might fail if there are existing rows with the new values)
    await queryInterface.sequelize.query(`
      ALTER TABLE tenants 
      MODIFY COLUMN status ENUM('active', 'suspended', 'trial', 'unpaid') 
      NOT NULL DEFAULT 'trial';
    `);

    await queryInterface.removeColumn('tenants', 'next_billing_date');
  }
};
