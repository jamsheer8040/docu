const { Op } = require('sequelize');
const { Tenant, TenantHistory } = require('../models');

async function checkExpiries() {
  console.log('[Cron] Starting Tenant Expiry Check...');
  const now = new Date();

  try {
    // 1. Check expired trials
    const expiredTrials = await Tenant.findAll({
      where: {
        status: 'trial',
        trial_ends_at: {
          [Op.lt]: now
        }
      }
    });

    for (const tenant of expiredTrials) {
      tenant.status = 'trial_expired';
      await tenant.save();

      await TenantHistory.create({
        tenant_id: tenant.id,
        action: 'Auto Expired (Trial)',
        old_status: 'trial',
        new_status: 'trial_expired',
        plan_id: tenant.plan_id
      });
      console.log(`[Cron] Tenant ${tenant.id} (${tenant.name}) marked as trial_expired.`);
    }

    // 2. Check expired active subscriptions
    const expiredActive = await Tenant.findAll({
      where: {
        status: 'active',
        subscription_ends_at: {
          [Op.lt]: now
        }
      }
    });

    for (const tenant of expiredActive) {
      tenant.status = 'expired';
      await tenant.save();

      await TenantHistory.create({
        tenant_id: tenant.id,
        action: 'Auto Expired (Subscription)',
        old_status: 'active',
        new_status: 'expired',
        plan_id: tenant.plan_id
      });
      console.log(`[Cron] Tenant ${tenant.id} (${tenant.name}) marked as expired.`);
    }

    // 3. Check Recurring Billing
    const { TenantInvoice, Plan } = require('../models');
    const dueForBilling = await Tenant.findAll({
      where: {
        status: 'active',
        next_billing_date: {
          [Op.lte]: now
        }
      },
      include: [{ model: Plan }]
    });

    for (const tenant of dueForBilling) {
      if (tenant.Plan) {
        const amount = tenant.billing_cycle === 'yearly' ? tenant.Plan.price_yearly : tenant.Plan.price_monthly;
        const invoiceCount = await TenantInvoice.count();
        
        // Generate new invoice
        await TenantInvoice.create({
          tenant_id: tenant.id,
          invoice_number: `INV-SAAS-${10000 + invoiceCount + 1}`,
          amount,
          status: 'unpaid',
          due_date: new Date()
        });

        // Advance next_billing_date and subscription_ends_at
        const nextDate = new Date(tenant.next_billing_date);
        if (tenant.billing_cycle === 'yearly') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        } else {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        tenant.next_billing_date = nextDate;
        tenant.subscription_ends_at = nextDate; // Keep subscription active
        await tenant.save();

        await TenantHistory.create({
          tenant_id: tenant.id,
          action: 'Recurring Invoice Generated',
          old_status: 'active',
          new_status: 'active',
          plan_id: tenant.plan_id
        });
        console.log(`[Cron] Generated recurring invoice for Tenant ${tenant.id} (${tenant.name}). Next billing: ${nextDate}`);
      }
    }

    console.log(`[Cron] Completed. Updated ${expiredTrials.length} trials, ${expiredActive.length} expired active, and generated ${dueForBilling.length} recurring invoices.`);
    process.exit(0);
  } catch (err) {
    console.error('[Cron Error]', err);
    process.exit(1);
  }
}

checkExpiries();
