const User = require('./models/User');
const Store = require('./models/Store');

async function checkDemoUser() {
    try {
        console.log('🔍 Checking all users and their store assignments...\n');
        
        // Get all users
        const users = await User.findWithFilters({}, 100, 0);
        
        console.log(`Found ${users.length} users:`);
        console.log('=' .repeat(80));
        
        for (const user of users) {
            console.log(`👤 User: ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Store ID: ${user.store_id || 'NOT ASSIGNED'}`);
            
            if (user.store_id) {
                try {
                    const store = await Store.findById(user.store_id);
                    if (store) {
                        console.log(`   Store Name: ${store.name}`);
                        console.log(`   Store Location: ${store.address}, ${store.state}`);
                    } else {
                        console.log(`   Store Name: STORE NOT FOUND (ID: ${user.store_id})`);
                    }
                } catch (err) {
                    console.log(`   Store Name: ERROR FETCHING STORE (${err.message})`);
                }
            } else {
                console.log(`   Store Name: NO STORE ASSIGNED`);
            }
            console.log('-'.repeat(60));
        }
        
        // Check specifically for demo user
        console.log('\n🎯 Looking specifically for demo user...');
        const demoUser = users.find(u => u.email.includes('demo') || u.name.toLowerCase().includes('demo'));
        
        if (demoUser) {
            console.log(`✅ Found demo user: ${demoUser.name} (${demoUser.email})`);
            console.log(`   Store assignment: ${demoUser.store_id ? 'ASSIGNED' : 'NOT ASSIGNED'}`);
        } else {
            console.log('❌ No demo user found');
        }
        
    } catch (error) {
        console.error('Error checking users:', error);
    }
    
    process.exit(0);
}

checkDemoUser();