const { User, Role } = require('./models');

async function debug() {
  try {
    const roles = await Role.findAll();
    console.log("Roles found:", roles.map(r => `${r.id}: ${r.name}`).join(", "));
    
    const users = await User.findAll({ include: [Role] });
    console.log("Users found:", users.length);
    users.forEach(u => {
      console.log(`- ${u.id}: ${u.name} (${u.email}) - RoleID: ${u.role_id} (${u.Role?.name || 'NONE'})`);
    });
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    process.exit();
  }
}

debug();
