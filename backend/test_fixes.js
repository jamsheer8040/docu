const API_URL = 'http://localhost:5000/api/v1';
let token = '';

async function runTests() {
  try {
    console.log('--- Starting API Verification ---');
    
    // Login to get token
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@docclear.com',
        password: 'password123'
      })
    }).catch(() => null);
    
    const jwt = require('jsonwebtoken');
    token = jwt.sign({ id: 1, role: 'Administrator' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

    const fetchAPI = async (endpoint, options = {}) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        if (!res.ok) {
            const err = new Error(data.message || 'API Error');
            err.status = res.status;
            err.data = data;
            throw err;
        }
        return data;
    };

    // 1. Test Customer Creation with Null Email
    console.log('\n1. Testing Customer Creation (Null Email)...');
    const custRes = await fetchAPI('/customers', {
      method: 'POST',
      body: JSON.stringify({
          name: 'API Test Customer',
          phone_whatsapp: '+971501231234',
          country: 'UAE'
      })
    });
    console.log('Customer created successfully. ID:', custRes.data.id);
    const customerId = custRes.data.id;

    // 2. Test Invoice Calculation
    console.log('\n2. Testing Invoice Creation and Calculation...');
    const invoicePayload = {
      customer_id: customerId,
      due_date: new Date().toISOString().split('T')[0],
      items: [
        { description: 'Service A', quantity: 1, unit_price: 1000 },
        { description: 'Service B', quantity: 2, unit_price: 250 }
      ],
      discount: 100,
      tax: 70
    };
    
    let invRes = await fetchAPI('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoicePayload)
    });
    console.log('Invoice created successfully. ID:', invRes.data.id);
    console.log('Expected Total: 1470');
    console.log('Actual Total:', invRes.data.total);
    console.log('Actual Subtotal:', invRes.data.subtotal);
    
    if (parseFloat(invRes.data.total) !== 1470) {
        console.error('❌ BUG 1: Calculation Error!');
    } else {
        console.log('✅ Calculation is Correct.');
    }

    const invoiceId = invRes.data.id;

    // 3. Test Wallet Sync
    console.log('\n3. Testing Wallet Sync...');
    const accRes = await fetchAPI('/wallet/accounts');
    const bankAccount = accRes.data.find(a => a.type === 'Bank');
    
    if (!bankAccount) {
        console.error('No Bank account found for wallet sync test.');
        return;
    }
    
    const initialBalance = parseFloat(bankAccount.balance);
    console.log(`Initial Bank Balance: ${initialBalance}`);

    await fetchAPI(`/invoices/${invoiceId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
            status: 'Paid',
            account_id: bankAccount.id
        })
    });
    
    const accResAfter = await fetchAPI('/wallet/accounts');
    const bankAccountAfter = accResAfter.data.find(a => a.id === bankAccount.id);
    const finalBalance = parseFloat(bankAccountAfter.balance);
    console.log(`Final Bank Balance: ${finalBalance}`);
    
    if (finalBalance === initialBalance + 1470) {
        console.log('✅ Wallet Sync is Correct.');
    } else {
        console.error('❌ BUG 2: Wallet Sync Failed! Expected:', initialBalance + 1470, 'Got:', finalBalance);
    }
    
    // 4. Test Customer Deletion Guard
    console.log('\n4. Testing Customer Deletion Guard...');
    const custRes2 = await fetchAPI('/customers', {
      method: 'POST',
      body: JSON.stringify({
          name: 'Delete Guard Test',
          phone_whatsapp: '+971501230000'
      })
    });
    const c2Id = custRes2.data.id;
    await fetchAPI('/invoices', {
      method: 'POST',
      body: JSON.stringify({
          customer_id: c2Id,
          items: [{ description: 'Test', quantity: 1, unit_price: 100 }]
      })
    });
    
    try {
        await fetchAPI(`/customers/${c2Id}`, { method: 'DELETE' });
        console.error('❌ BUG: Customer with unpaid invoice was deleted!');
    } catch (err) {
        if (err.status === 400 && err.data.message.includes('unpaid invoices')) {
            console.log('✅ Customer Deletion Guard worked perfectly. Message:', err.data.message);
        } else {
            console.error('❌ BUG: Customer deletion failed with unexpected error:', err.data || err.message);
        }
    }

    console.log('\n--- API Verification Complete ---');
    
  } catch (err) {
    console.error('Test script failed:', err.data || err.message);
  }
}

runTests();
