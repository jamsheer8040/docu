'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('leads', 'customer_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('leads', 'customer_id');
  }
};
