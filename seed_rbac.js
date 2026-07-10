const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./backend/models');
const { sequelize, Role, User } = db;

async function sync() {
  try {
    console.log('Force syncing database...');
    await sequelize.sync({ alter: true });
    console.log('Database synced.');

    // Create default roles if they don't exist
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

    const [staffRole] = await Role.findOrCreate({
      where: { name: 'Staff' },
      defaults: {
        permissions: {
          dashboard: { read: true },
          customers: { read: true, write: true, delete: false },
          documents: { read: true, write: true, delete: false },
          services: { read: true, write: false, delete: false },
          invoices: { read: true, write: true, delete: false },
          expenses: { read: true, write: true, delete: false },
          wallet: { read: true, write: false },
          reports: { read: true },
          settings: { read: false, write: false }
        }
      }
    });

    console.log('Default roles verified.');
    
    // Assign Super Admin to first user if role_id is null
    const firstUser = await User.findOne();
    if (firstUser && !firstUser.role_id) {
        await firstUser.update({ role_id: adminRole.id });
        console.log('Assigned Admin role to the first user.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Sync FAILED:', err);
    process.exit(1);
  }
}

sync();
