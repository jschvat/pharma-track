const axios = require('axios');

async function testSpecialChars() {
    try {
        // First, login to get a token
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@pharmatrak.com',
            password: 'Admin123!'
        });
        
        if (loginResponse.status === 200) {
            const token = loginResponse.data.token;
            const headers = { 'Authorization': `Bearer ${token}` };
            
            // Test different parameter combinations that might cause JSON parsing issues
            const testCases = [
                { page: 1, limit: 10 },
                { page: 1, limit: 10, search: 'test' },
                { page: 1, limit: 10, search: 'test\'s pharmacy' },  // Single quote
                { page: 1, limit: 10, search: 'test"s pharmacy' },   // Double quote
                { page: 1, limit: 10, search: 'test\\pharmacy' },    // Backslash
                { page: 1, limit: 10, search: 'test\npharmacy' },    // Newline
                { page: 1, limit: 10, search: 'test\tpharmacy' },    // Tab
            ];
            
            for (let i = 0; i < testCases.length; i++) {
                console.log(`\nTest case ${i + 1}:`, testCases[i]);
                try {
                    const response = await axios.get('http://localhost:3001/api/stores', {
                        headers,
                        params: testCases[i]
                    });
                    console.log('✅ Success');
                } catch (error) {
                    console.log('❌ Error:', error.message);
                    if (error.response) {
                        console.log('Response status:', error.response.status);
                    }
                }
            }
            
        } else {
            console.log('Login failed:', loginResponse.status);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testSpecialChars();