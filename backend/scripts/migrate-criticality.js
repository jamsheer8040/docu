/**
 * Migration: Add criticality columns to service_orders
 * and seed escalation config into system_configs
 */
const sequelize = require('../config/database');

async function migrate() {
  try {
    console.log('[Criticality Migration] Adding columns to service_orders...');
    await sequelize.query(`
      ALTER TABLE service_orders 
      ADD COLUMN IF NOT EXISTS criticality 
        ENUM('Normal','Moderate','Critical') NOT NULL DEFAULT 'Normal'
    `);
    await sequelize.query(`
      ALTER TABLE service_orders 
      ADD COLUMN IF NOT EXISTS initial_criticality 
        ENUM('Normal','Moderate','Critical') NOT NULL DEFAULT 'Normal'
    `);

    console.log('[Criticality Migration] Seeding system_configs...');
    const configs = [
      { key: 'svc_escalation_normal_to_moderate_days',   value: '2' },
      { key: 'svc_escalation_normal_to_critical_days',   value: '4' },
      { key: 'svc_escalation_moderate_to_critical_days', value: '2' },
    ];

    for (const cfg of configs) {
      await sequelize.query(
        `INSERT INTO system_configs (\`key\`, value, created_at, updated_at)
         VALUES (?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE value = value`,
        { replacements: [cfg.key, cfg.value] }
      );
    }

    console.log('[Criticality Migration] Done ✓');
  } catch (err) {
    console.error('[Criticality Migration] FAILED:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();
