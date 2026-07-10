const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('./models');
const { sequelize, User, Role } = db;
const bcrypt = require('bcryptjs');

async function repair() {
  try {
    console.log('[Repair] Attempting to fix DB schema and seed data...');
    
    // 1. Sync
    await sequelize.sync({ alter: true });
    console.log('[Repair] Database synchronized.');

    // 2. Seed Default Roles
    const [adminRole] = await Role.findOrCreate({
      where: { name: 'Admin' },
      defaults: {
        permissions: {
          dashboard: { read: true },
          customers: { read: true, write: true, delete: true },
          documents: { read: true, write: true, delete: true },
          services: { read: true, write: true, delete: true },
          invoices: { read: true, write: true, delete: true },
          expenses: { read: true, write: true, delete: true },
          wallet: { read: true, write: true },
          reports: { read: true },
          settings: { read: true, write: true }
        }
      }
    });
    console.log('[Repair] Admin role ensured.');

    const [staffRole] = await Role.findOrCreate({
      where: { name: 'Staff' },
      defaults: {
        permissions: {
          dashboard: { read: true },
          customers: { read: true, write: true, delete: false },
          documents: { read: true, write: true, delete: false },
          services: { read: true, write: true, delete: false },
          invoices: { read: true, write: true, delete: false },
          expenses: { read: true, write: true, delete: false },
          wallet: { read: true, write: false },
          reports: { read: true },
          settings: { read: false, write: false }
        }
      }
    });
    console.log('[Repair] Staff role ensured.');

    // 3. Ensure an entry user exists (admin@docclear.com / admin123)
    const email = 'admin@test.com';
    let adminUser = await User.findOne({ where: { email } });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Super Admin',
        email: email,
        password_hash: 'admin123', // hooks will hash it
        role_id: adminRole.id,
        is_active: true
      });
      console.log('[Repair] Created NEW Super Admin user: admin@test.com / admin123');
    } else {
      await adminUser.update({ role_id: adminRole.id });
      console.log('[Repair] Updated existing admin@test.com user with Admin role.');
    }

    console.log('[Repair] DONE. System should be stable now.');
    process.exit(0);
  } catch (err) {
    console.error('[Repair] FAILED:', err);
    process.exit(1);
  }
}

repair();
