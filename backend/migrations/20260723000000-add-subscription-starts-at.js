'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('tenants');
    
    if (!tableInfo.subscription_starts_at) {
      await queryInterface.addColumn('tenants', 'subscription_starts_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tenants', 'subscription_starts_at');
  }
};
