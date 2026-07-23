async function run() {
  try {
    console.log('Logging in...');
    const res = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'password123' })
    });
    const resData = await res.json();
    console.log("Login Res:", resData);
    const token = resData.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('Fetching Dashboard...');
    const db = await fetch('http://localhost:5000/api/v1/management/dashboard', { headers });
    console.log('Dashboard:', await db.json());

    console.log('Fetching Shareholders...');
    const sh = await fetch('http://localhost:5000/api/v1/management/shareholders', { headers });
    console.log('Shareholders:', await sh.json());

    console.log('Fetching Capital...');
    const cap = await fetch('http://localhost:5000/api/v1/management/capital-transactions', { headers });
    console.log('Capital:', await cap.json());

    console.log('Fetching Dividends...');
    const div = await fetch('http://localhost:5000/api/v1/management/dividends', { headers });
    console.log('Dividends:', await div.json());

    console.log('All API tests passed.');
  } catch (err) {
    console.error('API Error:', err.message);
  }
}

run();
