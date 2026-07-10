const { Role } = require('./models');

async function checkRole() {
  try {
    const role = await Role.findOne({ where: { name: 'Admin' } });
    if (!role) {
      console.log("Admin role NOT FOUND!");
      return;
    }
    console.log("Role:", role.name);
    console.log("Type of permissions:", typeof role.permissions);
    console.log("Permissions Content:", role.permissions);
    
    // Check if it's a string that needs parsing
    let perms = role.permissions;
    if (typeof perms === 'string') {
        try {
            perms = JSON.parse(perms);
            console.log("Successfully parsed string permissions.");
        } catch (e) {
            console.error("Failed to parse string permissions:", e.message);
        }
    }
    
    console.log("Settings.read:", perms?.settings?.read);
    console.log("Settings.write:", perms?.settings?.write);

  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    process.exit();
  }
}

checkRole();
