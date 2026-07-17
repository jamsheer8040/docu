'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create Sales Orders Table
    await queryInterface.createTable('sales_orders', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      order_number: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      order_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      contact_person: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      sales_executive_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      branch: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      customer_reference: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      internal_remarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Indexes for Sales Orders
    await queryInterface.addIndex('sales_orders', ['customer_id'], { name: 'sales_orders_customer_id_idx' });
    await queryInterface.addIndex('sales_orders', ['order_number', 'tenant_id'], { unique: true });

    // 2. Create Sales Order Items Table
    await queryInterface.createTable('sales_order_items', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      sales_order_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'sales_orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      service_type_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'service_types',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      service_name: {
        type: Sequelize.STRING(250),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      estimated_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      expected_processing_time: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      priority: {
        type: Sequelize.ENUM('Normal', 'Moderate', 'Critical'),
        defaultValue: 'Normal',
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('Not Started', 'Pending', 'Assigned', 'In Progress', 'Waiting for Customer', 'On Hold', 'Completed', 'Cancelled'),
        defaultValue: 'Not Started',
        allowNull: false
      },
      service_order_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'service_orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // 3. Update ServiceOrder ENUM status
    // In PostgreSQL, updating ENUMs requires dropping and recreating the type or adding values.
    // For MySQL, we can just alter table. Let's do a raw query that works if possible.
    // Assuming Postgres based on usual node-postgres, but the project might use MySQL or SQLite.
    // The previous migration '019-refactor-expense-types.js' used `DROP TYPE IF EXISTS` indicating PostgreSQL.
    // Or we can just use `queryInterface.changeColumn`.
    // Let's use `queryInterface.sequelize.query` for Postgres ENUM modification if it is postgres, or generic changeColumn.

    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      // PostgreSQL: Add new ENUM values. Cannot drop values easily, so we just add the new ones.
      await queryInterface.sequelize.query(`ALTER TYPE "enum_service_orders_status" ADD VALUE IF NOT EXISTS 'Assigned';`).catch(() => {});
      await queryInterface.sequelize.query(`ALTER TYPE "enum_service_orders_status" ADD VALUE IF NOT EXISTS 'In Progress';`).catch(() => {});
      await queryInterface.sequelize.query(`ALTER TYPE "enum_service_orders_status" ADD VALUE IF NOT EXISTS 'Waiting for Customer';`).catch(() => {});
      await queryInterface.sequelize.query(`ALTER TYPE "enum_service_orders_status" ADD VALUE IF NOT EXISTS 'On Hold';`).catch(() => {});
      await queryInterface.sequelize.query(`ALTER TYPE "enum_service_orders_status" ADD VALUE IF NOT EXISTS 'Completed';`).catch(() => {});
    } else {
      await queryInterface.changeColumn('service_orders', 'status', {
        type: Sequelize.ENUM('Pending', 'Assigned', 'In Progress', 'Waiting for Customer', 'On Hold', 'Completed', 'Cancelled'),
        defaultValue: 'Pending',
        allowNull: false
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('sales_order_items');
    await queryInterface.dropTable('sales_orders');
    
    // We cannot easily revert ENUM values in Postgres, so we leave them.
    // For others:
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== 'postgres') {
      await queryInterface.changeColumn('service_orders', 'status', {
        type: Sequelize.ENUM('Pending', 'InProgress', 'CompletedInvoicePending', 'CompletedInvoiceCreated', 'Cancelled'),
        defaultValue: 'Pending',
        allowNull: false
      });
    }
  }
};
