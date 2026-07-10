const { User, Role } = require('./models');

async function checkUsers() {
  try {
    const users = await User.findAll({
      include: [Role]
    });
    console.log("Total users found:", users.length);
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}) - Role: ${u.Role?.name || 'NONE'}`);
    });
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    process.exit();
  }
}

checkUsers();
