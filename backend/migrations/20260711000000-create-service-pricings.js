'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add pricing_mode to service_types
    await queryInterface.addColumn('service_types', 'pricing_mode', {
      type: Sequelize.ENUM('Single', 'Multi'),
      allowNull: false,
      defaultValue: 'Single'
    });

    // 2. Create service_type_pricings table
    await queryInterface.createTable('service_type_pricings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      service_type_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'service_types',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      pricing_type: {
        type: Sequelize.ENUM('Single', 'Normal', 'Prime', 'Prime+'),
        allowNull: false,
        defaultValue: 'Single'
      },
      service_charge: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      selling_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // 3. Migrate existing data from sell_price to service_type_pricings
    const [serviceTypes] = await queryInterface.sequelize.query(
      'SELECT id, sell_price, cost_price, created_at, updated_at FROM service_types;'
    );

    if (serviceTypes.length > 0) {
      const pricings = serviceTypes.map(st => ({
        service_type_id: st.id,
        pricing_type: 'Single',
        service_charge: (st.sell_price - st.cost_price).toFixed(2),
        selling_price: st.sell_price,
        created_at: st.created_at || new Date(),
        updated_at: st.updated_at || new Date()
      }));

      await queryInterface.bulkInsert('service_type_pricings', pricings);
    }

    // 4. Remove sell_price from service_types
    await queryInterface.removeColumn('service_types', 'sell_price');

    // 5. Add pricing_category to customers
    await queryInterface.addColumn('customers', 'pricing_category', {
      type: Sequelize.ENUM('Normal', 'Prime', 'Prime+'),
      allowNull: false,
      defaultValue: 'Normal'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback operations
    await queryInterface.removeColumn('customers', 'pricing_category');
    
    await queryInterface.addColumn('service_types', 'sell_price', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00
    });

    // Copy Single pricing back to sell_price
    const [pricings] = await queryInterface.sequelize.query(
      'SELECT service_type_id, selling_price FROM service_type_pricings WHERE pricing_type = "Single";'
    );
    
    for (const p of pricings) {
      await queryInterface.sequelize.query(
        `UPDATE service_types SET sell_price = ${p.selling_price} WHERE id = ${p.service_type_id};`
      );
    }

    await queryInterface.dropTable('service_type_pricings');
    await queryInterface.removeColumn('service_types', 'pricing_mode');
  }
};
