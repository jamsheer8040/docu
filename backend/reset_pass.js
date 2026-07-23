const { User } = require('./models');

async function run() {
  try {
    const users = await User.findAll({ where: { email: 'ashraf5@gmail.com' } });
    if (!users.length) return console.log('User not found');
    for (const u of users) {
      u.password_hash = 'password123';
      await u.save();
      console.log('Password updated for user in tenant:', u.tenant_id);
    }
  } catch (err) {
    console.error(err);
  }
}
run();
