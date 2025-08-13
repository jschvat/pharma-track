const axios = require('axios');

async function testUserPage() {
    try {
        console.log('🔍 Testing admin user management page...\n');
        
        // Login as admin
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@pharmatrak.com',
            password: 'Admin123!'
        });
        
        const token = loginResponse.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };
        const user = loginResponse.data.user;
        
        console.log('✅ Login successful');
        console.log(`   User: ${user.name} (ID: ${user.id})`);
        
        // Test the exact API calls the UserManagement component makes
        console.log('\n📍 Testing user API calls...');
        
        // 1. Get users with different parameter combinations
        const testCases = [
            { params: {}, description: 'No parameters' },
            { params: { page: 1 }, description: 'Page only' },
            { params: { limit: 10 }, description: 'Limit only' },
            { params: { page: 1, limit: 10 }, description: 'Page and limit' },
            { params: { page: 1, limit: 100 }, description: 'Page and limit 100' },
            { params: { limit: 1000 }, description: 'Large limit (should fail)' },
        ];
        
        for (const testCase of testCases) {
            try {
                console.log(`\n  Test: ${testCase.description}`);
                console.log(`  Params:`, testCase.params);
                
                const response = await axios.get('http://localhost:3001/api/users', {
                    headers,
                    params: testCase.params
                });
                
                console.log(`  ✅ Success: ${response.data.users?.length || 0} users returned`);
                
            } catch (error) {
                console.log(`  ❌ Error ${error.response?.status}: ${error.response?.data?.error || error.message}`);
                if (error.response?.data?.errors) {
                    console.log('    Validation errors:', error.response.data.errors);
                }
            }
        }
        
        // 2. Test stores API calls
        console.log('\n📍 Testing stores API calls for dropdowns...');
        try {
            const storesResponse = await axios.get('http://localhost:3001/api/stores', {
                headers,
                params: { limit: 100 }
            });
            console.log(`✅ Stores: ${storesResponse.data.stores?.length || 0} stores returned`);
        } catch (error) {
            console.log(`❌ Stores error ${error.response?.status}: ${error.response?.data?.error || error.message}`);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testUserPage();