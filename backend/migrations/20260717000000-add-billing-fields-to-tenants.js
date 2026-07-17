'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('tenants');
    
    if (!tableInfo.billing_cycle) {
      await queryInterface.addColumn('tenants', 'billing_cycle', {
        type: Sequelize.ENUM('monthly', 'yearly'),
        allowNull: true
      });
    }

    if (!tableInfo.next_billing_date) {
      await queryInterface.addColumn('tenants', 'next_billing_date', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tenants', 'billing_cycle');
    await queryInterface.removeColumn('tenants', 'next_billing_date');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tenants_billing_cycle";').catch(() => {});
  }
};
