const axios = require('axios');

// Test the exact issue by making the same call the frontend makes
async function testStoresAPI() {
    try {
        // First, login to get a token
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@pharmatrak.com',
            password: 'Admin123!'
        });
        
        if (loginResponse.status === 200) {
            const token = loginResponse.data.token;
            const headers = { 'Authorization': `Bearer ${token}` };
            
            // Now test the stores endpoint with params as the frontend does
            const storesResponse = await axios.get('http://localhost:3001/api/stores', {
                headers,
                params: {
                    page: 1,
                    limit: 10
                }
            });
            
            console.log('Success:', storesResponse.status);
            console.log('Data length:', storesResponse.data ? JSON.stringify(storesResponse.data).length : 0);
            
        } else {
            console.log('Login failed:', loginResponse.status);
        }
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testStoresAPI();