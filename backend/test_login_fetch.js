async function run() {
  try {
    const res = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ashraf5@gmail.com', password: 'password123' })
    });
    const result = await res.json();
    if (!res.ok) return console.log('Login failed:', result);

    const token = result.data.token;
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const soRes = await fetch('http://localhost:5000/api/v1/sales-orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer_id: 11,
        contact_person: 'Ashraf',
        sales_executive_id: null,
        branch: '',
        customer_reference: '',
        internal_remarks: '',
        items: [
          {
            service_type_id: 10,
            service_name: 'Visa Renewal',
            description: 'Test',
            quantity: 1,
            estimated_price: 240.00,
            expected_processing_time: '2 days',
            priority: 'Normal'
          }
        ]
      })
    });

    console.log('Create SO OK:', soRes.ok, await soRes.text());
  } catch (err) {
    console.log('Error:', err.message);
  }
}
run();
