const axios = require('axios');

async function testAdminSettings() {
    try {
        console.log('⚙️ Testing AdminSettings page flow...\n');
        
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
        
        // Step 2: Load store stats (same as AdminSettings loadStats)
        console.log('\n📊 Step 2: Loading store statistics');
        try {
            const storeStatsResponse = await axios.get('http://localhost:3001/api/stores/stats', {
                headers
            });
            console.log('✅ Store stats loaded successfully');
            console.log('   Data:', storeStatsResponse.data.stats);
        } catch (error) {
            console.log(`❌ Store stats error ${error.response?.status}: ${error.response?.data?.error || error.message}`);
            if (error.response?.data?.errors) {
                console.log('   Validation errors:', error.response.data.errors);
            }
        }
        
        // Step 3: Load users for stats (same as AdminSettings loadStats - now fixed)
        console.log('\n👥 Step 3: Loading users for statistics');
        try {
            const usersResponse = await axios.get('http://localhost:3001/api/users', {
                headers,
                params: { limit: 100 }  // Fixed limit
            });
            
            const users = usersResponse.data.users || [];
            console.log(`✅ Users loaded successfully: ${users.length} total users`);
            console.log(`   Admins: ${users.filter(u => u.role === 'admin').length}`);
            console.log(`   Active: ${users.filter(u => u.is_active).length}`);
        } catch (error) {
            console.log(`❌ Users error ${error.response?.status}: ${error.response?.data?.error || error.message}`);
            if (error.response?.data?.errors) {
                console.log('   Validation errors:', error.response.data.errors);
            }
        }
        
        // Step 4: Test the complete parallel loading (Promise.all)
        console.log('\n🔄 Step 4: Testing parallel loading (Promise.all)');
        try {
            const [storeResponse, userResponse] = await Promise.all([
                axios.get('http://localhost:3001/api/stores/stats', { headers }),
                axios.get('http://localhost:3001/api/users', { headers, params: { limit: 100 } })
            ]);
            
            console.log('✅ Parallel loading successful');
            console.log(`   Store stats: ${Object.keys(storeResponse.data.stats || {}).length} stats loaded`);
            console.log(`   Users: ${userResponse.data.users?.length || 0} users loaded`);
            
        } catch (error) {
            console.log(`❌ Parallel loading error ${error.response?.status}: ${error.response?.data?.error || error.message}`);
        }
        
        console.log('\n🎉 AdminSettings flow test completed!');
        
    } catch (error) {
        console.error('❌ Error in AdminSettings flow:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testAdminSettings();