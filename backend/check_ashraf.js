const { User } = require('./models');

async function check() {
  try {
    const users = await User.findAll({ where: { email: 'ashraf5@gmail.com' }, raw: true });
    console.log(users);
  } catch (err) {
    console.error(err);
  }
  process.exit();
}
check();
