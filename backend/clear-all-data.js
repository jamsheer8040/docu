const db = require('./models');

async function clearAllData() {
  try {
    console.log(`Starting to clear all transactional data across all tenants...`);

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
      'ServiceType',
      'DocumentType',
      'TenantInvoice'
    ];

    for (const modelName of modelsToClear) {
      if (db[modelName]) {
        await db[modelName].destroy({ where: {}, force: true });
        console.log(`Cleared all records from ${modelName}`);
      }
    }
    
    // Also reset wallet balances to 0
    await db.WalletAccount.update({ balance: 0 }, { where: {} });
    console.log(`Reset all WalletAccount balances to 0`);

    console.log('Successfully cleared all business data for all tenants.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exit(1);
  }
}

clearAllData();
