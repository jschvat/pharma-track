const axios = require('axios');

async function testFrontendSequence() {
    try {
        // Test the exact sequence the AdminStores component does
        console.log('🔄 Testing frontend sequence...');
        
        // 1. Login
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@pharmatrak.com',
            password: 'Admin123!'
        });
        
        if (loginResponse.status !== 200) {
            throw new Error('Login failed');
        }
        
        const token = loginResponse.data.token;
        const headers = { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        console.log('✅ Login successful');
        
        // 2. Load stores (same as AdminStores component)
        console.log('📦 Loading stores...');
        const storesResponse = await axios.get('http://localhost:3001/api/stores', {
            headers,
            params: {
                page: 1,
                limit: 10
            }
        });
        
        console.log('✅ Stores loaded successfully');
        console.log('📊 Found stores:', storesResponse.data.stores.length);
        
        // 3. Load users (same as AdminStores component)
        console.log('👥 Loading users...');
        const usersResponse = await axios.get('http://localhost:3001/api/users', {
            headers,
            params: {
                limit: 100
            }
        });
        
        console.log('✅ Users loaded successfully');
        console.log('📊 Found users:', usersResponse.data.users?.length || 0);
        
        console.log('🎉 All frontend requests completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testFrontendSequence();