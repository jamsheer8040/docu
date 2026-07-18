'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create voucher_designs table
    await queryInterface.createTable('voucher_designs', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      voucher_type: {
        type: Sequelize.ENUM('Invoice', 'Sales Order', 'Quotation', 'Payment Receipt', 'Expense Voucher'),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      branch: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      language: {
        type: Sequelize.ENUM('English', 'Arabic', 'Bilingual'),
        defaultValue: 'English',
        allowNull: false
      },
      layout: {
        type: Sequelize.STRING(50),
        defaultValue: 'A4 Portrait',
        allowNull: false
      },
      header_config: {
        type: Sequelize.JSON,
        allowNull: true
      },
      info_config: {
        type: Sequelize.JSON,
        allowNull: true
      },
      table_config: {
        type: Sequelize.JSON,
        allowNull: true
      },
      totals_config: {
        type: Sequelize.JSON,
        allowNull: true
      },
      footer_config: {
        type: Sequelize.JSON,
        allowNull: true
      },
      branding_config: {
        type: Sequelize.JSON,
        allowNull: true
      },
      print_config: {
        type: Sequelize.JSON,
        allowNull: true
      },
      number_format: {
        type: Sequelize.JSON,
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

    // Indexes for voucher_designs
    await queryInterface.addIndex('voucher_designs', ['tenant_id']);
    await queryInterface.addIndex('voucher_designs', ['voucher_type']);

    // 2. Create voucher_design_audit_logs table
    await queryInterface.createTable('voucher_design_audit_logs', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      voucher_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      template_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      previous_values: {
        type: Sequelize.JSON,
        allowNull: true
      },
      new_values: {
        type: Sequelize.JSON,
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

    // Indexes for audit logs
    await queryInterface.addIndex('voucher_design_audit_logs', ['tenant_id']);
    await queryInterface.addIndex('voucher_design_audit_logs', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('voucher_design_audit_logs');
    await queryInterface.dropTable('voucher_designs');
  }
};
