const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Role, User, sequelize } = require('./models');
const bcrypt = require('bcryptjs');

async function run() {
  try {
    await sequelize.sync({ alter: true });
    
    // Admin Role
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

    // Staff Role
    await Role.findOrCreate({
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

    // Super Admin
    const email = 'admin@test.com';
    const [user] = await User.findOrCreate({
      where: { email },
      defaults: {
        name: 'System Administrator',
        password_hash: 'admin123',
        role_id: adminRole.id,
        is_active: true
      }
    });
    await user.update({ role_id: adminRole.id, password_hash: 'admin123' });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
