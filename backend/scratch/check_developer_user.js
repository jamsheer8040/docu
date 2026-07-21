const { User, Role } = require('../models');

async function main() {
  try {
    const user = await User.findOne({
      where: { email: 'developer@looppe.com' },
      include: [Role]
    });
    if (user) {
      console.log('User found:', JSON.stringify(user.toJSON(), null, 2));
    } else {
      console.log('User developer@looppe.com not found');
    }
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

main();
