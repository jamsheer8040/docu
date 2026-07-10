const { Role } = require('./models');

async function resetRoles() {
  try {
    console.log('[System] Force Resetting Role Permissions...');
    
    const adminPermissions = {
      dashboard: { read: true, write: true, delete: true },
      customers: { read: true, write: true, delete: true },
      documents: { read: true, write: true, delete: true },
      services: { read: true, write: true, delete: true },
      invoices: { read: true, write: true, delete: true },
      expenses: { read: true, write: true, delete: true },
      wallet: { read: true, write: true, delete: true },
      reports: { read: true, write: true, delete: true },
      settings: { read: true, write: true, delete: true }
    };

    const staffPermissions = {
      dashboard: { read: true, write: false, delete: false },
      customers: { read: true, write: true, delete: false },
      documents: { read: true, write: true, delete: false },
      services: { read: true, write: true, delete: false },
      invoices: { read: true, write: true, delete: false },
      expenses: { read: true, write: true, delete: false },
      wallet: { read: true, write: false, delete: false },
      reports: { read: true, write: false, delete: false },
      settings: { read: false, write: false, delete: false }
    };

    // Force Update Admin
    await Role.upsert({
        name: 'Admin',
        permissions: adminPermissions
    });

    // Force Update Staff
    await Role.upsert({
        name: 'Staff',
        permissions: staffPermissions
    });

    console.log('[System] ROLES RESTORED TO FULL ACCESS.');
    process.exit(0);
  } catch (err) {
    console.error('[System] RESTORATION FAILED:', err);
    process.exit(1);
  }
}

resetRoles();
