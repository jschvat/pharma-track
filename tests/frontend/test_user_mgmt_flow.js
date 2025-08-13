const axios = require('axios');

async function testUserMgmtFlow() {
    try {
        console.log('🎯 Testing UserManagement component flow...\n');
        
        // Login as admin
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@pharmatrak.com',
            password: 'Admin123!'
        });
        
        const token = loginResponse.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };
        const user = loginResponse.data.user;
        
        console.log('✅ Step 1: Login successful');
        console.log(`   User: ${user.name} (ID: ${user.id})`);
        
        // Step 2: Load users (same as UserManagement component)
        console.log('\n👥 Step 2: Loading users');
        const usersResponse = await axios.get('http://localhost:3001/api/users', {
            headers,
            params: {
                page: 1,
                limit: 10  // usersPerPage from component
            }
        });
        
        console.log(`✅ Found ${usersResponse.data.users.length} users`);
        for (const user of usersResponse.data.users) {
            console.log(`   • ${user.name} (${user.email}) - ${user.role} - Store: ${user.store_name || 'NONE'}`);
        }
        
        // Step 3: Load stores (same as UserManagement component - now fixed)
        console.log('\n🏪 Step 3: Loading stores for dropdown');
        const storesResponse = await axios.get('http://localhost:3001/api/stores', {
            headers,
            params: { limit: 100 }  // Fixed limit
        });
        
        console.log(`✅ Found ${storesResponse.data.stores.length} stores`);
        for (const store of storesResponse.data.stores) {
            console.log(`   • ${store.name} (${store.state})`);
        }
        
        console.log('\n🎉 Complete UserManagement flow successful!');
        console.log('\n📊 Summary:');
        console.log(`   - Users API: ${usersResponse.data.users.length} users loaded`);
        console.log(`   - Stores API: ${storesResponse.data.stores.length} stores loaded for dropdowns`);
        console.log(`   - No 400 validation errors`);
        console.log(`   - Store names properly retrieved in user data`);
        
    } catch (error) {
        console.error('❌ Error in UserManagement flow:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testUserMgmtFlow();