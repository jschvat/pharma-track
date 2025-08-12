const axios = require('axios');

async function checkStores() {
    try {
        console.log('🏪 Checking available stores...\n');
        
        // Login as admin
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@pharmatrak.com',
            password: 'Admin123!'
        });
        
        const token = loginResponse.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };
        
        console.log('✅ Logged in as admin');
        
        // Get all stores
        const storesResponse = await axios.get('http://localhost:3001/api/stores', {
            headers,
            params: { limit: 100 }
        });
        
        const stores = storesResponse.data.stores;
        console.log(`\nFound ${stores.length} stores:`);
        console.log('=' .repeat(80));
        
        for (const store of stores) {
            console.log(`🏪 Store ID: ${store.id}`);
            console.log(`   Name: ${store.name}`);
            console.log(`   Address: ${store.address}`);
            console.log(`   State: ${store.state}`);
            console.log(`   Admin: ${store.admin_name || 'NO ADMIN'} (${store.admin_email || ''})`);
            console.log('-'.repeat(60));
        }
        
        // Check if store ID 1 exists
        console.log('\n🔍 Checking store ID 1 specifically...');
        const store1 = stores.find(s => s.id === 1);
        if (store1) {
            console.log(`✅ Store ID 1 exists: ${store1.name}`);
            console.log(`   Location: ${store1.address}, ${store1.state}`);
        } else {
            console.log('❌ Store ID 1 does not exist');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

checkStores();