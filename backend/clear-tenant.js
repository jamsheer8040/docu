const db = require('./models');

async function clearTenant() {
  const tenantId = 2; // Betterway

  try {
    console.log(`Starting to clear data for tenant ID: ${tenantId}`);

    // Disable foreign key checks
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    const modelsToClear = [
      'WalletTransaction',
      'InvoiceItem',
      'Invoice',
      'ServiceOrder',
      'Document',
      'Expense',
      'ExpenseSubType',
      'ExpenseType',
      'Customer',
      'WalletAccount',
      'SystemConfig',
      'User',
      'TenantInvoice'
    ];

    for (const modelName of modelsToClear) {
      if (db[modelName]) {
        await db[modelName].destroy({ where: { tenant_id: tenantId }, force: true });
        console.log(`Cleared ${modelName}`);
      }
    }

    await db.Tenant.destroy({ where: { id: tenantId }, force: true });
    console.log(`Cleared Tenant`);

    // Enable foreign key checks
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Successfully cleared all data for Betterway.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exit(1);
  }
}

clearTenant();
