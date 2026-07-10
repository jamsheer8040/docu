const { Role } = require('./models');

async function dumpRoles() {
  try {
    const roles = await Role.findAll();
    console.log(JSON.stringify(roles, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

dumpRoles();
