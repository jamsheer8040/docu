'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create Shareholders
    await queryInterface.createTable('shareholders', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      shareholder_id: { type: Sequelize.STRING(50), allowNull: true },
      email: { type: Sequelize.STRING(255), allowNull: true },
      mobile: { type: Sequelize.STRING(50), allowNull: true },
      nationality: { type: Sequelize.STRING(100), allowNull: true },
      identity_number: { type: Sequelize.STRING(100), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      bank_details: { type: Sequelize.JSON, allowNull: true },
      ownership_percentage: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      joining_date: { type: Sequelize.DATEONLY, allowNull: true },
      status: { type: Sequelize.ENUM('Active', 'Inactive'), allowNull: false, defaultValue: 'Active' },
      tenant_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'tenants', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });

    await queryInterface.addIndex('shareholders', ['shareholder_id', 'tenant_id'], {
      unique: true,
      name: 'shareholders_shareholder_id_tenant_id_unique'
    });

    // 2. Create OwnershipChanges
    await queryInterface.createTable('ownership_changes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      shareholder_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'shareholders', key: 'id' } },
      previous_percentage: { type: Sequelize.DECIMAL(5, 2), allowNull: false },
      new_percentage: { type: Sequelize.DECIMAL(5, 2), allowNull: false },
      previous_capital_requirement: { type: Sequelize.DECIMAL(15, 2), allowNull: true },
      new_capital_requirement: { type: Sequelize.DECIMAL(15, 2), allowNull: true },
      user_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      reason: { type: Sequelize.TEXT, allowNull: true },
      date: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      attachment_url: { type: Sequelize.STRING(1024), allowNull: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'tenants', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // 3. Create CapitalTransactions
    await queryInterface.createTable('capital_transactions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      shareholder_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'shareholders', key: 'id' } },
      type: { type: Sequelize.ENUM('Contribution', 'Refund', 'Advance', 'Adjustment'), allowNull: false },
      amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      method: { type: Sequelize.STRING(100), allowNull: true },
      wallet_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'wallet_accounts', key: 'id' } },
      reference_number: { type: Sequelize.STRING(100), allowNull: true },
      remarks: { type: Sequelize.TEXT, allowNull: true },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      attachment_url: { type: Sequelize.STRING(1024), allowNull: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'tenants', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // 4. Create DividendDeclarations
    await queryInterface.createTable('dividend_declarations', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      financial_year: { type: Sequelize.STRING(20), allowNull: false },
      total_profit: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      dividend_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      declaration_date: { type: Sequelize.DATEONLY, allowNull: false },
      status: { type: Sequelize.ENUM('Draft', 'Declared', 'Partially Paid', 'Fully Paid', 'Cancelled'), allowNull: false, defaultValue: 'Draft' },
      remarks: { type: Sequelize.TEXT, allowNull: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'tenants', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // 5. Create DividendDistributions
    await queryInterface.createTable('dividend_distributions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      declaration_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'dividend_declarations', key: 'id' } },
      shareholder_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'shareholders', key: 'id' } },
      ownership_percentage: { type: Sequelize.DECIMAL(5, 2), allowNull: false },
      allocated_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      paid_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
      tenant_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'tenants', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // 6. Create DividendPayments
    await queryInterface.createTable('dividend_payments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      distribution_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'dividend_distributions', key: 'id' } },
      amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      method: { type: Sequelize.STRING(100), allowNull: true },
      wallet_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'wallet_accounts', key: 'id' } },
      reference_number: { type: Sequelize.STRING(100), allowNull: true },
      remarks: { type: Sequelize.TEXT, allowNull: true },
      tenant_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'tenants', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // 7. Update Roles with 'management' permission
    const roles = await queryInterface.sequelize.query(
      `SELECT id, permissions FROM roles;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const role of roles) {
      let perms = role.permissions;
      if (typeof perms === 'string') perms = JSON.parse(perms);
      
      if (!perms.management) {
        perms.management = { read: false, write: false, delete: false };
        // If it's Super Admin (id=1 or name='Super Admin'), give full access
        if (role.id === 1) {
          perms.management = { read: true, write: true, delete: true };
        }

        await queryInterface.sequelize.query(
          `UPDATE roles SET permissions = :perms WHERE id = :id;`,
          {
            replacements: { perms: JSON.stringify(perms), id: role.id },
            type: Sequelize.QueryTypes.UPDATE
          }
        );
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('dividend_payments');
    await queryInterface.dropTable('dividend_distributions');
    await queryInterface.dropTable('dividend_declarations');
    await queryInterface.dropTable('capital_transactions');
    await queryInterface.dropTable('ownership_changes');
    await queryInterface.dropTable('shareholders');
  }
};
