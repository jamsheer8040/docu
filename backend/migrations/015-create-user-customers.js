'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create the user_customers join table
    await queryInterface.createTable('user_customers', {
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // 2. Migrate existing data from users table
    await queryInterface.sequelize.query(`
      INSERT INTO user_customers (user_id, customer_id, created_at, updated_at)
      SELECT id, customer_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP 
      FROM users 
      WHERE customer_id IS NOT NULL
    `);

    // 3. Drop the customer_id column from users table
    // Fetch foreign keys constraints on customer_id
    try {
      const constraints = await queryInterface.sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'customer_id' AND TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL;
      `);
      if (constraints && constraints[0] && constraints[0].length > 0) {
        for (const c of constraints[0]) {
          await queryInterface.removeConstraint('users', c.CONSTRAINT_NAME);
        }
      }
      await queryInterface.removeColumn('users', 'customer_id');
    } catch (err) {
      console.warn('Could not drop customer_id from users', err.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // 1. Add customer_id back to users
    await queryInterface.addColumn('users', 'customer_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 2. Try to restore data from user_customers
    await queryInterface.sequelize.query(`
      UPDATE users u
      JOIN (
        SELECT user_id, MAX(customer_id) as customer_id
        FROM user_customers
        GROUP BY user_id
      ) uc ON u.id = uc.user_id
      SET u.customer_id = uc.customer_id
    `);

    // 3. Drop the join table
    await queryInterface.dropTable('user_customers');
  }
};
