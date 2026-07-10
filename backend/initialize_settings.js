const { SystemConfig, sequelize } = require('./models');

async function seedSettings() {
  try {
    console.log('[System] Syncing models...');
    await sequelize.sync({ alter: true });
    console.log('[System] Initializing System Configuration...');
    
    const defaults = [
      { key: 'business_name', value: 'DocClear Management' },
      { key: 'base_currency', value: 'AED' },
      { key: 'contact_email', value: 'support@docclear.com' },
      { key: 'default_language', value: 'English' }
    ];

    for (const item of defaults) {
      await SystemConfig.findOrCreate({
        where: { key: item.key },
        defaults: { value: item.value }
      });
    }

    console.log('[System] SYSTEM CONFIGURATION INITIALIZED.');
    process.exit(0);
  } catch (err) {
    console.error('[System] INITIALIZATION FAILED:', err);
    process.exit(1);
  }
}

seedSettings();
