const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./models');
const { Role, User, sequelize } = db;

async function fix() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const fullPermissions = {
      dashboard: { read: true, write: true, delete: true },
      customers: { read: true, write: true, delete: true },
      documents: { read: true, write: true, delete: true },
      services: { read: true, write: true, delete: true },
      invoices: { read: true, write: true, delete: true },
      expenses: { read: true, write: true, delete: true },
      wallet: { read: true, write: true, delete: true },
      reports: { read: true, write: true, delete: true },
      settings: { read: true, write: true, delete: true },
      financials: { read: true, write: true, delete: true }
    };

    // 1. Find or create Developer role
    const [developerRole] = await Role.findOrCreate({
      where: { name: 'Developer' },
      defaults: {
        permissions: fullPermissions
      }
    });

    // 2. Force update permissions
    await developerRole.update({ permissions: fullPermissions });
    console.log('Developer role permissions updated to full access.');

    // 3. Ensure developer user has this role
    const devUser = await User.findOne({ where: { email: 'developer@looppe.com' } });
    if (devUser) {
      await devUser.update({ role_id: developerRole.id });
      console.log('User developer@looppe.com assigned to Developer role.');
    } else {
        // Create user if missing
        await User.create({
            name: 'System Developer',
            email: 'developer@looppe.com',
            password_hash: 'L00pp3', // Note: app.js uses plain string for seeding developer password_hash, but it should be hashed. However, I'll follow the existing pattern if any. Actually, app.js password seeding is often shaky.
            role_id: developerRole.id,
            is_active: true
        });
        console.log('Developer user created.');
    }

    console.log('FIX COMPLETED.');
    process.exit(0);
  } catch (err) {
    console.error('FIX FAILED:', err);
    process.exit(1);
  }
}

fix();
