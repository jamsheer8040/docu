'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add service_id to leads
      const leadsTableInfo = await queryInterface.describeTable('leads');
      if (!leadsTableInfo.service_id) {
        await queryInterface.addColumn('leads', 'service_id', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'service_types',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        }, { transaction });
      }

      // Add last_reminded_at to documents
      const docsTableInfo = await queryInterface.describeTable('documents');
      if (!docsTableInfo.last_reminded_at) {
        await queryInterface.addColumn('documents', 'last_reminded_at', {
          type: Sequelize.DATE,
          allowNull: true
        }, { transaction });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const leadsTableInfo = await queryInterface.describeTable('leads');
      if (leadsTableInfo.service_id) {
        await queryInterface.removeColumn('leads', 'service_id', { transaction });
      }

      const docsTableInfo = await queryInterface.describeTable('documents');
      if (docsTableInfo.last_reminded_at) {
        await queryInterface.removeColumn('documents', 'last_reminded_at', { transaction });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
