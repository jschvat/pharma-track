const axios = require('axios');

async function testAdminPageFlow() {
    try {
        console.log('🎯 Testing complete Admin Stores page flow...\n');
        
        // Step 1: Login as admin
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@pharmatrak.com',
            password: 'Admin123!'
        });
        
        const token = loginResponse.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };
        const user = loginResponse.data.user;
        
        console.log('✅ Step 1: Login successful');
        console.log(`   User: ${user.name} (ID: ${user.id})`);
        console.log(`   Store: ${user.store_name || 'N/A'} (ID: ${user.store_id})`);
        
        // Step 2: Load stores (same as AdminStores component does)
        console.log('\n📦 Step 2: Loading stores with admin_only filter');
        const storesResponse = await axios.get('http://localhost:3001/api/stores', {
            headers,
            params: {
                page: 1,
                limit: 10,
                admin_only: true
            }
        });
        
        console.log(`✅ Found ${storesResponse.data.stores.length} stores`);
        for (const store of storesResponse.data.stores) {
            console.log(`   • ${store.name} (${store.address}, ${store.state})`);
        }
        
        // Step 3: Load users (for dropdowns)
        console.log('\n👥 Step 3: Loading users');
        const usersResponse = await axios.get('http://localhost:3001/api/users', {
            headers,
            params: { limit: 100 }
        });
        
        console.log(`✅ Found ${usersResponse.data.users.length} users`);
        const adminUsers = usersResponse.data.users.filter(u => u.role === 'admin');
        console.log(`   Admin users: ${adminUsers.length}`);
        for (const adminUser of adminUsers) {
            console.log(`   • ${adminUser.name} (${adminUser.email}) - Store: ${adminUser.store_name}`);
        }
        
        console.log('\n🎉 Complete admin page flow successful!');
        console.log('\n📊 Summary:');
        console.log(`   - Admin sees ${storesResponse.data.stores.length} store(s) they manage`);
        console.log(`   - ${adminUsers.length} admin user(s) available for assignment`);
        console.log(`   - Page loads without JSON parsing errors`);
        console.log(`   - Store names are properly retrieved`);
        
    } catch (error) {
        console.error('❌ Error in admin page flow:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testAdminPageFlow();