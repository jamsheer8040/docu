const { Tenant, sequelize } = require('../models');
const { Op } = require('sequelize');

async function processExpiredTrials() {
  console.log('[SaaS Jobs] Running processExpiredTrials...');
  try {
    const expiredTenants = await Tenant.findAll({
      where: {
        status: 'trial',
        trial_ends_at: {
          [Op.lt]: new Date()
        }
      }
    });

    if (expiredTenants.length === 0) {
      console.log('[SaaS Jobs] No expired trials found.');
      return;
    }

    const { TenantHistory } = require('../models');

    for (const tenant of expiredTenants) {
      await sequelize.transaction(async (t) => {
        tenant.status = 'trial_expired';
        await tenant.save({ transaction: t });

        await TenantHistory.create({
          tenant_id: tenant.id,
          action: 'Trial Expired (Auto)',
          old_status: 'trial',
          new_status: 'trial_expired',
          plan_id: tenant.plan_id
        }, { transaction: t });
      });
      console.log(`[SaaS Jobs] Tenant ${tenant.id} moved to trial_expired.`);
    }
  } catch (err) {
    console.error('[SaaS Jobs] Error processing expired trials:', err);
  }
}

// In a real production app, use node-cron or pm2 scheduling.
// For now, we export the function so it can be called if needed.
module.exports = {
  processExpiredTrials
};
