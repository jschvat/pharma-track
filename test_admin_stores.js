const axios = require('axios');

async function testAdminStores() {
    try {
        console.log('🔍 Testing admin stores filtering...\n');
        
        // Login as admin
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@pharmatrak.com',
            password: 'Admin123!'
        });
        
        const token = loginResponse.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };
        const user = loginResponse.data.user;
        
        console.log('✅ Logged in as:', user.name, `(ID: ${user.id})`);
        console.log('   User Store ID:', user.store_id);
        
        // Test 1: Get all stores
        console.log('\n📍 Test 1: All stores');
        const allStoresResponse = await axios.get('http://localhost:3001/api/stores', {
            headers,
            params: { limit: 100 }
        });
        console.log(`Found ${allStoresResponse.data.stores.length} total stores`);
        
        // Test 2: Get stores with admin_only filter
        console.log('\n📍 Test 2: Admin-only stores');
        const adminStoresResponse = await axios.get('http://localhost:3001/api/stores', {
            headers,
            params: { limit: 100, admin_only: true }
        });
        console.log(`Found ${adminStoresResponse.data.stores.length} stores where user is admin`);
        
        // Show details of admin stores
        if (adminStoresResponse.data.stores.length > 0) {
            console.log('\nStores where current user is admin:');
            for (const store of adminStoresResponse.data.stores) {
                console.log(`  • ${store.name} (ID: ${store.id})`);
                console.log(`    Admin: ${store.admin_name} (${store.admin_email})`);
                console.log(`    Location: ${store.address}, ${store.state}`);
            }
        } else {
            console.log('\n❌ No stores found where current user is admin');
            console.log('Let me check all stores to see admin assignments...');
            
            for (const store of allStoresResponse.data.stores) {
                console.log(`  • ${store.name} (ID: ${store.id})`);
                console.log(`    Admin User ID: ${store.admin_user_id || 'NONE'}`);
                console.log(`    Admin: ${store.admin_name || 'NO ADMIN'} (${store.admin_email || ''})`);
            }
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testAdminStores();