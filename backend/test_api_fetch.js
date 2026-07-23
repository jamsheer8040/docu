const jwt = require('jsonwebtoken');
const { User } = require('./models');
require('dotenv').config();

async function run() {
  try {
    const user = await User.findOne({ where: { email: 'ashraf5@gmail.com' } });
    if (!user) return console.log('User not found');

    const token = jwt.sign(
      { id: user.id, email: user.email, role_id: user.role_id, tenant_id: user.tenant_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const response = await fetch('http://localhost:5000/api/v1/customers', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
