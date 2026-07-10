const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize('docclear_db', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: console.log
});

async function migrate() {
  try {
    console.log('[System] Manual RBAC Migration Started...');
    
    // 1. Create Roles Table if not exists
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        permissions JSON NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      ) ENGINE=InnoDB;
    `);

    // 2. Drop old ENUM role if exists and add role_id
    try {
        await sequelize.query('ALTER TABLE users DROP COLUMN role;');
    } catch (e) { console.log('Old role column already gone.'); }

    try {
        await sequelize.query('ALTER TABLE users ADD COLUMN role_id INT DEFAULT NULL;');
        await sequelize.query('ALTER TABLE users ADD CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id);');
    } catch (e) { console.log('role_id column or FK already exists.'); }

    // 3. Seed Roles
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const adminPerms = JSON.stringify({
      dashboard: { read: true },
      customers: { read: true, write: true, delete: true },
      documents: { read: true, write: true, delete: true },
      services: { read: true, write: true, delete: true },
      invoices: { read: true, write: true, delete: true },
      expenses: { read: true, write: true, delete: true },
      wallet: { read: true, write: true },
      reports: { read: true },
      settings: { read: true, write: true }
    });

    await sequelize.query(`
      INSERT IGNORE INTO roles (name, permissions, created_at, updated_at) 
      VALUES ('Admin', '${adminPerms}', '${now}', '${now}');
    `);

    // 4. Update the Super Admin
    const [roles] = await sequelize.query("SELECT id FROM roles WHERE name = 'Admin' LIMIT 1;");
    const adminRoleId = roles[0].id;
    
    await sequelize.query(`
      UPDATE users SET role_id = ${adminRoleId} WHERE email = 'admin@test.com' OR email = 'admin@docclear.com';
    `);

    console.log('[System] MIGRATION COMPLETE.');
    process.exit(0);
  } catch (err) {
    console.error('[System] MIGRATION FAILED:', err);
    process.exit(1);
  }
}

migrate();
