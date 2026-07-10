const { User, Role } = require('./models');

async function checkAdmin() {
  try {
    const admin = await User.findOne({ 
      where: { email: 'admin@docclear.com' },
      include: [Role]
    });
    
    if (admin) {
      console.log(`Admin user exists: ID ${admin.id}, Name: ${admin.name}, Role: ${admin.Role?.name}`);
    } else {
      console.log("Admin user (admin@docclear.com) is MISSING from the database.");
    }

    const allUsers = await User.findAll({ include: [Role] });
    console.log(`Total users in DB: ${allUsers.length}`);
    allUsers.forEach(u => console.log(`- ${u.id}: ${u.name} (${u.Role?.name})`));

  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    process.exit();
  }
}

checkAdmin();
