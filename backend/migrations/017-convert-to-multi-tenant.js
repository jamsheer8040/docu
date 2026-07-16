'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 0. Add missing type column to roles table (sync/migration fallback)
    const rolesTableInfo = await queryInterface.describeTable('roles');
    if (!rolesTableInfo.type) {
      await queryInterface.addColumn('roles', 'type', {
        type: Sequelize.ENUM('Internal', 'CustomerPortal'),
        allowNull: false,
        defaultValue: 'Internal'
      });
    }

    // Add missing balance column to wallet_accounts table (sync/migration fallback)
    const walletTableInfo = await queryInterface.describeTable('wallet_accounts');
    if (!walletTableInfo.balance) {
      await queryInterface.addColumn('wallet_accounts', 'balance', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      });
    }

    // 1. Create plans table
    await queryInterface.createTable('plans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      price_monthly: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      price_yearly: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      max_users: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 5
      },
      max_customers: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 100
      },
      max_documents: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 200
      },
      max_wallet_accounts: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 3
      },
      features: {
        type: Sequelize.JSON,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // 2. Create tenants table
    await queryInterface.createTable('tenants', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      plan_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'plans',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('active', 'suspended', 'trial', 'unpaid'),
        allowNull: false,
        defaultValue: 'trial'
      },
      trial_ends_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      subscription_ends_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      billing_cycle: {
        type: Sequelize.ENUM('monthly', 'yearly'),
        allowNull: true
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

    // 3. Create tenant_invoices table
    await queryInterface.createTable('tenant_invoices', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      invoice_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('unpaid', 'paid', 'void'),
        allowNull: false,
        defaultValue: 'unpaid'
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      paid_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    // 4. Insert Default Plan and Default Tenant (so existing rows can link to them)
    await queryInterface.bulkInsert('plans', [{
      id: 1,
      name: 'Free Plan',
      price_monthly: 0.00,
      price_yearly: 0.00,
      max_users: 5,
      max_customers: 100,
      max_documents: 200,
      max_wallet_accounts: 3,
      features: JSON.stringify([]),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    await queryInterface.bulkInsert('tenants', [{
      id: 1,
      name: 'Default Tenant',
      slug: 'default',
      plan_id: 1,
      status: 'trial',
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // 5. Add tenant_id columns as NULLABLE first
    const tablesWithTenantId = [
      { name: 'users', allowNull: true }, // Nullable for global super admins
      { name: 'roles', allowNull: true },
      { name: 'customers', allowNull: false },
      { name: 'documents', allowNull: false },
      { name: 'document_types', allowNull: true },
      { name: 'wallet_accounts', allowNull: false },
      { name: 'wallet_transactions', allowNull: false },
      { name: 'service_types', allowNull: false },
      { name: 'service_orders', allowNull: false },
      { name: 'invoices', allowNull: false },
      { name: 'invoice_items', allowNull: false },
      { name: 'expenses', allowNull: false },
      { name: 'system_configs', allowNull: true }
    ];

    for (const table of tablesWithTenantId) {
      await queryInterface.addColumn(table.name, 'tenant_id', {
        type: Sequelize.INTEGER,
        allowNull: true, // Temporarily nullable to allow seeding existing data
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: table.allowNull ? 'SET NULL' : 'CASCADE'
      });
    }

    // 6. Set existing records' tenant_id to 1 (Default Tenant)
    for (const table of tablesWithTenantId) {
      await queryInterface.bulkUpdate(table.name, { tenant_id: 1 }, {});
    }

    // 7. Alter columns to NOT NULL for the tables that require it
    for (const table of tablesWithTenantId) {
      if (!table.allowNull) {
        await queryInterface.changeColumn(table.name, 'tenant_id', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'tenants',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        });
      }
    }

    // 8. Adjust unique indexes for multi-tenant isolation
    // Roles
    try {
      await queryInterface.removeIndex('roles', 'name');
    } catch (e) {
      console.log('Skipping index removal for roles.name');
    }
    await queryInterface.addIndex('roles', ['name', 'tenant_id'], { unique: true });

    // Wallet Accounts
    try {
      await queryInterface.removeIndex('wallet_accounts', 'name');
    } catch (e) {
      console.log('Skipping index removal for wallet_accounts.name');
    }
    await queryInterface.addIndex('wallet_accounts', ['name', 'tenant_id'], { unique: true });

    // Service Types
    try {
      await queryInterface.removeIndex('service_types', 'name');
    } catch (e) {
      console.log('Skipping index removal for service_types.name');
    }
    await queryInterface.addIndex('service_types', ['name', 'tenant_id'], { unique: true });

    // Invoices
    try {
      await queryInterface.removeIndex('invoices', 'invoice_number');
    } catch (e) {
      console.log('Skipping index removal for invoices.invoice_number');
    }
    await queryInterface.addIndex('invoices', ['invoice_number', 'tenant_id'], { unique: true });

    // System Configs
    try {
      await queryInterface.removeIndex('system_configs', 'key');
    } catch (e) {
      console.log('Skipping index removal for system_configs.key');
    }
    await queryInterface.addIndex('system_configs', ['key', 'tenant_id'], { unique: true });

    // Customers
    try {
      await queryInterface.removeIndex('customers', 'email');
    } catch (e) {
      console.log('Skipping index removal for customers.email');
    }
    await queryInterface.addIndex('customers', ['email', 'tenant_id'], { unique: true });

    // Document Types
    try {
      await queryInterface.removeIndex('document_types', 'name');
    } catch (e) {
      console.log('Skipping index removal for document_types.name');
    }
    await queryInterface.addIndex('document_types', ['name', 'tenant_id'], { unique: true });
  },

  down: async (queryInterface, Sequelize) => {
    const restoreSingularIndexes = [
      { table: 'roles', column: 'name' },
      { table: 'wallet_accounts', column: 'name' },
      { table: 'service_types', column: 'name' },
      { table: 'invoices', column: 'invoice_number' },
      { table: 'system_configs', column: 'key' },
      { table: 'customers', column: 'email' },
      { table: 'document_types', column: 'name' }
    ];

    for (const item of restoreSingularIndexes) {
      try {
        await queryInterface.removeIndex(item.table, [item.column, 'tenant_id']);
        await queryInterface.addIndex(item.table, [item.column], { unique: true });
      } catch (e) {
        console.error(`Failed during index rollback for ${item.table}.${item.column}`);
      }
    }

    const tables = [
      'users', 'roles', 'customers', 'documents', 'document_types',
      'wallet_accounts', 'wallet_transactions', 'service_types',
      'service_orders', 'invoices', 'invoice_items', 'expenses', 'system_configs'
    ];

    for (const table of tables) {
      await queryInterface.removeColumn(table, 'tenant_id');
    }

    await queryInterface.dropTable('tenant_invoices');
    await queryInterface.dropTable('tenants');
    await queryInterface.dropTable('plans');
  }
};
