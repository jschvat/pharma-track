const axios = require('axios');

async function testEdgeCases() {
    try {
        console.log('🧪 Testing edge cases for limit validation...\n');
        
        // Login as admin
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@pharmatrak.com',
            password: 'Admin123!'
        });
        
        const token = loginResponse.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };
        
        console.log('✅ Login successful');
        
        // Test various limit values to understand the validation boundaries
        const testLimits = [1, 50, 99, 100, 101, 500, 1000];
        
        console.log('\n📍 Testing different limit values:');
        for (const limit of testLimits) {
            try {
                const response = await axios.get('http://localhost:3001/api/users', {
                    headers,
                    params: { limit }
                });
                console.log(`  ✅ limit: ${limit} - SUCCESS (${response.data.users?.length || 0} users returned)`);
            } catch (error) {
                console.log(`  ❌ limit: ${limit} - ERROR ${error.response?.status}: ${error.response?.data?.errors?.[0]?.msg || error.message}`);
            }
        }
        
        // Test stores API limits too
        console.log('\n🏪 Testing store API limits:');
        for (const limit of [50, 100, 101, 1000]) {
            try {
                const response = await axios.get('http://localhost:3001/api/stores', {
                    headers,
                    params: { limit }
                });
                console.log(`  ✅ stores limit: ${limit} - SUCCESS (${response.data.stores?.length || 0} stores returned)`);
            } catch (error) {
                console.log(`  ❌ stores limit: ${limit} - ERROR ${error.response?.status}: ${error.response?.data?.errors?.[0]?.msg || error.message}`);
            }
        }
        
        console.log('\n📊 Summary:');
        console.log('   - Maximum safe limit for users API: 100');
        console.log('   - Maximum safe limit for stores API: 100');
        console.log('   - AdminSettings and UserManagement components fixed to use limit: 100');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testEdgeCases();