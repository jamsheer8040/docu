'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Clear existing data to avoid validation/unique errors on rerun
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    // We use TRUNCATE to reset auto-increment counters on MySQL
    const tables = ['wallet_transactions', 'expenses', 'expense_sub_types', 'expense_types', 'invoice_items', 'invoices', 'service_orders', 'documents', 'service_types', 'customers', 'users', 'tenants', 'plans', 'roles', 'wallet_accounts', 'system_configs'];
    for (const table of tables) {
      await queryInterface.sequelize.query(`TRUNCATE TABLE ${table}`);
    }
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    const passwordHash = await bcrypt.hash('password123', 10);
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    // 1. Roles
    await queryInterface.bulkInsert('roles', [
      {
        id: 1,
        name: 'Admin',
        permissions: JSON.stringify({
          dashboard: { read: true, write: true, delete: true },
          customers: { read: true, write: true, delete: true },
          documents: { read: true, write: true, delete: true },
          services: { read: true, write: true, delete: true },
          invoices: { read: true, write: true, delete: true },
          expenses: { read: true, write: true, delete: true },
          wallet: { read: true, write: true, delete: true },
          reports: { read: true, write: true, delete: true },
          settings: { read: true, write: true, delete: true }
        }),
        created_at: now,
        updated_at: now
      },
      {
        id: 2,
        name: 'Staff',
        permissions: JSON.stringify({
          dashboard: { read: true, write: false, delete: false },
          customers: { read: true, write: true, delete: false },
          documents: { read: true, write: true, delete: false },
          services: { read: true, write: true, delete: false },
          invoices: { read: true, write: true, delete: false },
          expenses: { read: true, write: true, delete: false },
          wallet: { read: true, write: false, delete: false },
          reports: { read: true, write: false, delete: false },
          settings: { read: false, write: false, delete: false }
        }),
        created_at: now,
        updated_at: now
      },
      {
        id: 3,
        name: 'Developer',
        permissions: JSON.stringify({}),
        created_at: now,
        updated_at: now
      }
    ]);

    // 1.5 Plans and Tenants
    await queryInterface.bulkInsert('plans', [
      { id: 1, name: 'Pro', price_monthly: 99.00, price_yearly: 990.00, max_users: 10, max_customers: -1, max_documents: -1, max_wallet_accounts: -1, features: JSON.stringify(['all']), is_active: true, created_at: now, updated_at: now }
    ]);

    await queryInterface.bulkInsert('tenants', [
      { id: 1, name: 'Demo Company', plan_id: 1, status: 'active', subscription_ends_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), created_at: now, updated_at: now }
    ]);

    // 2. Users
    await queryInterface.bulkInsert('users', [
      { id: 1, name: 'Admin User', email: 'admin@docclear.com', password_hash: passwordHash, role_id: 1, tenant_id: 1, is_active: true, created_at: now, updated_at: now },
      { id: 2, name: 'Staff User', email: 'staff@docclear.com', password_hash: passwordHash, role_id: 2, tenant_id: 1, is_active: true, created_at: now, updated_at: now },
      { id: 3, name: 'Super Admin', email: 'developer@docclear.com', password_hash: passwordHash, role_id: 3, tenant_id: null, is_active: true, created_at: now, updated_at: now }
    ]);

    // 3. Wallet Accounts
    await queryInterface.bulkInsert('wallet_accounts', [
      { id: 1, name: 'Main Cash', currency: 'AED', description: 'Office physical cash', is_active: true, created_at: now, updated_at: now },
      { id: 2, name: 'Emirates NBD', currency: 'AED', description: 'Business current account', is_active: true, created_at: now, updated_at: now },
      { id: 3, name: 'Petty Cash', currency: 'AED', description: 'Small daily expenses', is_active: true, created_at: now, updated_at: now }
    ]);

    // 4. Service Types
    await queryInterface.bulkInsert('service_types', [
      { id: 1, name: 'New Visa', category: 'Visa', sell_price: 3500, cost_price: 2800, description: 'Employment visa processing', is_active: true, created_at: now, updated_at: now },
      { id: 2, name: 'Visa Renewal', category: 'Visa', sell_price: 2800, cost_price: 2100, description: 'Existing visa renewal', is_active: true, created_at: now, updated_at: now },
      { id: 3, name: 'Trade License Renewal', category: 'PRO', sell_price: 5000, cost_price: 4200, description: 'Economic department renewal', is_active: true, created_at: now, updated_at: now },
      { id: 4, name: 'Emirates ID Typing', category: 'Govt', sell_price: 250, cost_price: 180, description: 'EID application typing', is_active: true, created_at: now, updated_at: now },
      { id: 5, name: 'Medical Fitness', category: 'Govt', sell_price: 450, cost_price: 320, description: 'Medical test coordination', is_active: true, created_at: now, updated_at: now }
    ]);

    // 5. Customers
    await queryInterface.bulkInsert('customers', [
      { id: 1, name: 'Global Tech Solutions', email: 'contact@globaltech.com', phone_whatsapp: '+971500000001', city: 'Dubai', country: 'UAE', trade_license_no: 'TL-1001', is_active: true, created_at: now, updated_at: now },
      { id: 2, name: 'Fresh Foods LLC', email: 'hr@freshfoods.ae', phone_whatsapp: '+971500000002', city: 'Abu Dhabi', country: 'UAE', trade_license_no: 'TL-1002', is_active: true, created_at: now, updated_at: now },
      { id: 3, name: 'Zayed & Sons Trading', email: 'zayed@trading.com', phone_whatsapp: '+971500000003', city: 'Sharjah', country: 'UAE', trade_license_no: 'TL-1003', is_active: true, created_at: now, updated_at: now },
      { id: 4, name: 'Ahmad Al Bastaki', email: 'ahmad@example.com', phone_whatsapp: '+971500000004', city: 'Dubai', country: 'UAE', is_active: true, created_at: now, updated_at: now },
      { id: 5, name: 'Luxury Logistics', email: 'info@luxury-log.com', phone_whatsapp: '+971500000005', city: 'Dubai', country: 'UAE', trade_license_no: 'TL-1005', is_active: true, created_at: now, updated_at: now }
    ]);

    // 6. Documents
    const documentExpiries = [
        { customer_id: 1, type: 'TradeLicense', expiry_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) }, // Expired 2 days ago
        { customer_id: 1, type: 'Visa', expiry_date: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000) }, // Critical (4 days)
        { customer_id: 2, type: 'EmiratesID', expiry_date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000) }, // Warning (10 days)
        { customer_id: 3, type: 'Passport', expiry_date: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000) }, // Safe (45 days)
        { customer_id: 4, type: 'MedicalFitness', expiry_date: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000) }, // Month (20 days)
        { customer_id: 5, type: 'TradeLicense', expiry_date: new Date(now.getTime() + 300 * 24 * 60 * 60 * 1000) } // Safe (300 days)
    ];
    await queryInterface.bulkInsert('documents', documentExpiries.map(doc => ({
        ...doc,
        doc_number: 'DOC-' + Math.floor(Math.random() * 100000),
        issue_date: lastMonth,
        created_at: now,
        updated_at: now
    })));

    // 7. Expense Types
    await queryInterface.bulkInsert('expense_types', [
      { id: 1, type_name: 'Utilities', description: 'Office utilities', status: 'Active', tenant_id: 1, created_at: now, updated_at: now },
      { id: 2, type_name: 'Office Rent', description: 'Office rent', status: 'Active', tenant_id: 1, created_at: now, updated_at: now },
      { id: 3, type_name: 'Supplies', description: 'Office supplies', status: 'Active', tenant_id: 1, created_at: now, updated_at: now }
    ]);

    await queryInterface.bulkInsert('expense_sub_types', [
      { id: 1, sub_type_name: 'Electricity', expense_type_id: 1, status: 'Active', tenant_id: 1, created_at: now, updated_at: now },
      { id: 2, sub_type_name: 'Water', expense_type_id: 1, status: 'Active', tenant_id: 1, created_at: now, updated_at: now },
      { id: 3, sub_type_name: 'Monthly Rent', expense_type_id: 2, status: 'Active', tenant_id: 1, created_at: now, updated_at: now },
      { id: 4, sub_type_name: 'Stationery', expense_type_id: 3, status: 'Active', tenant_id: 1, created_at: now, updated_at: now }
    ]);

    // 8. Expenses
    await queryInterface.bulkInsert('expenses', [
      { id: 1, description: 'Office Electricity', expense_sub_type_id: 1, amount: 850.00, status: 'Paid', payment_date: lastMonth, account_id: 2, tenant_id: 1, created_at: lastMonth, updated_at: lastMonth },
      { id: 2, description: 'Water Bill', expense_sub_type_id: 2, amount: 150.00, status: 'Paid', payment_date: lastMonth, account_id: 1, tenant_id: 1, created_at: lastMonth, updated_at: lastMonth },
      { id: 3, description: 'Monthly Rent', expense_sub_type_id: 3, amount: 5000.00, status: 'Paid', payment_date: twoMonthsAgo, account_id: 2, tenant_id: 1, created_at: twoMonthsAgo, updated_at: twoMonthsAgo },
      { id: 4, description: 'Office Rent (Current)', expense_sub_type_id: 3, amount: 5000.00, status: 'Unpaid', tenant_id: 1, created_at: now, updated_at: now },
      { id: 5, description: 'Printing Stationery', expense_sub_type_id: 4, amount: 320.00, status: 'Unpaid', tenant_id: 1, created_at: now, updated_at: now }
    ]);

    // 8. Service Orders
    await queryInterface.bulkInsert('service_orders', [
      { id: 1, customer_id: 1, service_type_id: 1, status: 'Completed', notes: 'Urgent processing', started_at: lastMonth, completed_at: lastMonth, created_at: lastMonth, updated_at: lastMonth },
      { id: 2, customer_id: 2, service_type_id: 2, status: 'Completed', started_at: lastMonth, completed_at: now, created_at: lastMonth, updated_at: now },
      { id: 3, customer_id: 3, service_type_id: 3, status: 'InProgress', started_at: now, created_at: now, updated_at: now },
      { id: 4, customer_id: 1, service_type_id: 4, status: 'Pending', created_at: now, updated_at: now }
    ]);

    // 9. Invoices
    await queryInterface.bulkInsert('invoices', [
      { id: 1, invoice_number: 'INV-2024-001', customer_id: 1, service_order_id: 1, subtotal: 3500, discount: 0, tax: 175, total: 3675, cost_total: 2800, status: 'Paid', due_date: now, paid_at: now, created_at: now, updated_at: now },
      { id: 2, invoice_number: 'INV-2024-002', customer_id: 2, service_order_id: 2, subtotal: 2800, discount: 100, tax: 135, total: 2835, cost_total: 2100, status: 'Paid', due_date: now, paid_at: now, created_at: now, updated_at: now },
      { id: 3, invoice_number: 'INV-2024-003', customer_id: 3, subtotal: 5000, discount: 0, tax: 250, total: 5250, cost_total: 4200, status: 'Sent', due_date: now, created_at: now, updated_at: now }
    ]);

    // 10. Invoice Items
    await queryInterface.bulkInsert('invoice_items', [
      { id: 1, invoice_id: 1, description: 'New Visa Processing', quantity: 1, unit_price: 3500, cost_price: 2800, total: 3500, created_at: now, updated_at: now },
      { id: 2, invoice_id: 2, description: 'Visa Renewal', quantity: 1, unit_price: 2800, cost_price: 2100, total: 2800, created_at: now, updated_at: now },
      { id: 3, invoice_id: 3, description: 'Trade License Renewal', quantity: 1, unit_price: 5000, cost_price: 4200, total: 5000, created_at: now, updated_at: now }
    ]);

    // 11. Wallet Transactions
    await queryInterface.bulkInsert('wallet_transactions', [
        { id: 1, account_id: 1, type: 'Manual', direction: 'In', amount: 10000, balance_after: 10000, description: 'Initial cash load', created_at: twoMonthsAgo },
        { id: 2, account_id: 2, type: 'Manual', direction: 'In', amount: 50000, balance_after: 50000, description: 'Initial bank balance', created_at: twoMonthsAgo },
        { id: 3, account_id: 2, type: 'Income', direction: 'In', amount: 3675, balance_after: 53675, reference_id: 1, reference_type: 'Invoice', description: 'Payment for INV-2024-001', created_at: now },
        { id: 4, account_id: 1, type: 'Income', direction: 'In', amount: 2835, balance_after: 12835, reference_id: 2, reference_type: 'Invoice', description: 'Payment for INV-2024-002', created_at: now },
        { id: 5, account_id: 2, type: 'Expense', direction: 'Out', amount: 850, balance_after: 52825, reference_id: 1, reference_type: 'Expense', description: 'Office Electricity', created_at: lastMonth },
        { id: 6, account_id: 1, type: 'Expense', direction: 'Out', amount: 150, balance_after: 12685, reference_id: 2, reference_type: 'Expense', description: 'Water Bill', created_at: lastMonth },
        { id: 7, account_id: 2, type: 'Expense', direction: 'Out', amount: 5000, balance_after: 47825, reference_id: 3, reference_type: 'Expense', description: 'Monthly Rent', created_at: twoMonthsAgo }
    ]);

    // 12. System Configs
    await queryInterface.bulkInsert('system_configs', [
      { id: 1, key: 'business_name', value: 'DocClear Management', created_at: now, updated_at: now },
      { id: 2, key: 'base_currency', value: 'AED', created_at: now, updated_at: now },
      { id: 3, key: 'contact_email', value: 'support@docclear.com', created_at: now, updated_at: now },
      { id: 4, key: 'default_language', value: 'English', created_at: now, updated_at: now }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('wallet_transactions', null, {});
    await queryInterface.bulkDelete('expenses', null, {});
    await queryInterface.bulkDelete('expense_sub_types', null, {});
    await queryInterface.bulkDelete('expense_types', null, {});
    await queryInterface.bulkDelete('documents', null, {});
    await queryInterface.bulkDelete('customers', null, {});
    await queryInterface.bulkDelete('service_types', null, {});
    await queryInterface.bulkDelete('wallet_accounts', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('tenants', null, {});
    await queryInterface.bulkDelete('plans', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  }
};
