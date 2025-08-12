require('dotenv').config();
const axios = require('axios');

async function testUserCreation() {
  console.log('=== Testing User Creation API ===\n');

  try {
    // First authenticate
    console.log('Step 1: Authenticating...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@pharmatrak.com',
      password: 'Admin123!'
    });

    const token = loginResponse.data.token;
    console.log('✅ Authentication successful');

    // Test user creation
    console.log('\nStep 2: Creating new user...');
    
    const userData = {
      name: 'Test Admin 6',
      email: 'testadmin6@example.com',
      phone: '5551234578',
      password: 'TestPassword123!',
      address: '789 Admin Street, Test City, TC 12345',
      role: 'admin'
    };

    console.log('Sending user data:', userData);

    const response = await axios.post(
      'http://localhost:3001/api/users',
      userData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ User creation successful!');
    console.log('Response:', response.data);

  } catch (error) {
    console.error('❌ User creation failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testUserCreation();