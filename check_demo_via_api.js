const axios = require('axios');

async function checkDemoUserViaAPI() {
    try {
        console.log('🔍 Checking demo user via API...\n');
        
        // Login as admin
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@pharmatrak.com',
            password: 'Admin123!'
        });
        
        const token = loginResponse.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };
        
        console.log('✅ Logged in as admin');
        
        // Get all users
        const usersResponse = await axios.get('http://localhost:3001/api/users', {
            headers,
            params: { limit: 100 }
        });
        
        const users = usersResponse.data.users;
        console.log(`\nFound ${users.length} users:`);
        console.log('=' .repeat(80));
        
        for (const user of users) {
            console.log(`👤 User: ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Store ID: ${user.store_id || 'NOT ASSIGNED'}`);
            console.log(`   Store Name: ${user.store_name || 'NO STORE'}`);
            console.log('-'.repeat(60));
        }
        
        // Check for demo users
        console.log('\n🎯 Looking for demo users...');
        const demoUsers = users.filter(u => 
            u.email.toLowerCase().includes('demo') || 
            u.name.toLowerCase().includes('demo') ||
            u.email.toLowerCase().includes('test') ||
            u.name.toLowerCase().includes('test')
        );
        
        if (demoUsers.length > 0) {
            console.log(`✅ Found ${demoUsers.length} demo/test user(s):`);
            for (const user of demoUsers) {
                console.log(`   • ${user.name} (${user.email})`);
                console.log(`     Store assignment: ${user.store_id ? `ASSIGNED to ${user.store_name}` : 'NOT ASSIGNED'}`);
            }
        } else {
            console.log('❌ No demo/test users found');
        }
        
        // Check non-admin users
        const nonAdminUsers = users.filter(u => u.role !== 'admin');
        console.log(`\n👥 Non-admin users (${nonAdminUsers.length}):`);
        for (const user of nonAdminUsers) {
            console.log(`   • ${user.name} (${user.email}) - Store: ${user.store_name || 'NONE'}`);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

checkDemoUserViaAPI();