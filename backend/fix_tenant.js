const { Role } = require('./models');

async function fixRoles() {
  try {
    const roles = await Role.findAll();
    for (const role of roles) {
      let permissions = role.permissions;
      if (typeof permissions === 'string') permissions = JSON.parse(permissions);
      
      let updated = false;
      if (!permissions.sales_orders) {
        if (role.name === 'Admin') {
          permissions.sales_orders = { read: true, write: true, delete: true };
        } else if (role.name === 'Staff') {
          permissions.sales_orders = { read: true, write: true, delete: false };
        } else {
          permissions.sales_orders = { read: false, write: false, delete: false };
        }
        updated = true;
      }
      
      if (updated) {
        await Role.update({ permissions }, { where: { id: role.id } });
        console.log(`Updated permissions for Role ${role.name} (ID: ${role.id})`);
      }
    }
    console.log('Done!');
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

fixRoles();
