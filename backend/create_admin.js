const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize('docclear_db', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

async function createAdmin() {
  try {
    console.log('[Setup] Creating Admin Credentials...');
    
    // Define Role & User in-place to bypass association issues for this script
    const Role = sequelize.define('Role', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
      permissions: { type: DataTypes.JSON, allowNull: false }
    }, { tableName: 'roles', underscored: true, timestamps: true });

    const User = sequelize.define('User', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING, allowNull: false },
      role_id: { type: DataTypes.INTEGER },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
    }, { tableName: 'users', underscored: true, timestamps: true });

    // 1. Ensure Admin Role exists
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
    console.log(`[Setup] Admin Role ID: ${adminRole.id}`);

    // 2. Create/Update Admin User
    const email = 'admin@test.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: {
        name: 'System Administrator',
        password_hash: hashedPassword,
        role_id: adminRole.id,
        is_active: true
      }
    });

    if (!created) {
      await user.update({
        password_hash: hashedPassword,
        role_id: adminRole.id,
        is_active: true
      });
      console.log(`[Setup] Existing admin user updated.`);
    } else {
      console.log(`[Setup] New admin user created.`);
    }

    console.log('---------------------------------------------');
    console.log(`EMAIL:    ${email}`);
    console.log(`PASSWORD: ${password}`);
    console.log('---------------------------------------------');
    console.log('[Setup] Admin ready. You can now login.');
    process.exit(0);
  } catch (err) {
    console.error('[Setup] FAILED:', err);
    process.exit(1);
  }
}

createAdmin();
