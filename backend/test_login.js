const axios = require('axios');
async function run() {
  try {
    const res = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'ashraf5@gmail.com',
      password: 'password123'
    });
    console.log('Login success!', res.data.user.email);
    const token = res.data.token;

    const custRes = await axios.get('http://localhost:5000/api/v1/customers', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Customers found:', custRes.data.data.length);
  } catch (err) {
    if (err.response) {
      console.log('Error:', err.response.data);
    } else {
      console.log('Error:', err.message);
    }
  }
}
run();
