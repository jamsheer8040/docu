'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('expenses', 'sub_category', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'category'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('expenses', 'sub_category');
  }
};
