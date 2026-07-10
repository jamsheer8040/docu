const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize('docclear_db', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: console.log
});

async function repair() {
  try {
    console.log('[System] Force Repairing RBAC Schema...');
    
    // Define Role Model in-place to avoid require issues
    const Role = sequelize.define('Role', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
      permissions: { type: DataTypes.JSON, allowNull: false }
    }, { tableName: 'roles', underscored: true });

    // Define User Model in-place
    const User = sequelize.define('User', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING, allowNull: false },
      role_id: { 
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'roles', key: 'id' }
      },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
    }, { tableName: 'users', underscored: true });

    // Sync roles first
    await Role.sync({ alter: true });
    await User.sync({ alter: true });

    // Seed Roles
    const [adminRole] = await Role.findOrCreate({
      where: { name: 'Admin' },
      defaults: {
        permissions: {
          dashboard: { read: true, write: true, delete: true },
          customers: { read: true, write: true, delete: true },
          documents: { read: true, write: true, delete: true },
          services: { read: true, write: true, delete: true },
          invoices: { read: true, write: true, delete: true },
          expenses: { read: true, write: true, delete: true },
          wallet: { read: true, write: true, delete: true },
          reports: { read: true, write: true, delete: true },
          settings: { read: true, write: true, delete: true }
        }
      }
    });

    const [staffRole] = await Role.findOrCreate({
      where: { name: 'Staff' },
      defaults: {
        permissions: {
          dashboard: { read: true, write: false, delete: false },
          customers: { read: true, write: true, delete: false },
          documents: { read: true, write: true, delete: false },
          services: { read: true, write: true, delete: false },
          invoices: { read: true, write: true, delete: false },
          expenses: { read: true, write: true, delete: false },
          wallet: { read: true, write: false, delete: false },
          reports: { read: true, write: false, delete: false },
          settings: { read: false, write: false, delete: false }
        }
      }
    });

    // Seed Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const [user, created] = await User.findOrCreate({
      where: { email: 'admin@test.com' },
      defaults: {
        name: 'Super Admin',
        password_hash: hashedPassword,
        role_id: adminRole.id,
        is_active: true
      }
    });

    if (!created) {
        await user.update({ role_id: adminRole.id });
    }

    console.log('[System] REPAIR SUCCESSFUL.');
    process.exit(0);
  } catch (err) {
    console.error('[System] REPAIR FAILED:', err);
    process.exit(1);
  }
}

repair();
