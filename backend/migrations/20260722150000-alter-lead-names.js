'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.changeColumn('leads', 'company_name', {
        type: Sequelize.STRING(150),
        allowNull: false
      }, { transaction });

      await queryInterface.changeColumn('leads', 'name', {
        type: Sequelize.STRING(150),
        allowNull: true
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.changeColumn('leads', 'company_name', {
        type: Sequelize.STRING(150),
        allowNull: true
      }, { transaction });

      await queryInterface.changeColumn('leads', 'name', {
        type: Sequelize.STRING(150),
        allowNull: false
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
