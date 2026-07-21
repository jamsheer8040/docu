'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('promo_codes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      discount_type: {
        type: Sequelize.ENUM('percentage', 'fixed'),
        allowNull: false,
        defaultValue: 'percentage'
      },
      discount_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      valid_from: {
        type: Sequelize.DATE,
        allowNull: true
      },
      valid_until: {
        type: Sequelize.DATE,
        allowNull: true
      },
      max_uses: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      current_uses: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('promo_codes');
  }
};
