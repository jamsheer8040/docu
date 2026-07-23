'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Safely remove the global unique index if it exists
    try {
      await queryInterface.removeIndex('shareholders', 'shareholder_id');
      console.log('Successfully dropped global unique index on shareholders.shareholder_id');
    } catch (e) {
      console.log('Global index shareholder_id already removed or does not exist, skipping drop.');
    }

    // 2. Safely add the composite unique index per tenant
    try {
      await queryInterface.addIndex('shareholders', ['shareholder_id', 'tenant_id'], {
        unique: true,
        name: 'shareholders_shareholder_id_tenant_id_unique'
      });
      console.log('Successfully created composite unique index on shareholders(shareholder_id, tenant_id)');
    } catch (e) {
      console.log('Composite unique index already exists, skipping creation.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeIndex('shareholders', 'shareholders_shareholder_id_tenant_id_unique');
      await queryInterface.addIndex('shareholders', ['shareholder_id'], { unique: true });
    } catch (e) {
      console.error('Failed to rollback index modification:', e);
    }
  }
};
