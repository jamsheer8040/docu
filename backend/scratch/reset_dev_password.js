const { User } = require('../models');

async function main() {
  try {
    const devUser = await User.findOne({ where: { email: 'developer@looppe.com' } });
    if (devUser) {
      devUser.password_hash = 'L00pp3';
      await devUser.save();
      console.log('Password for developer@looppe.com reset to L00pp3');
    } else {
      console.log('User not found.');
    }
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

main();
