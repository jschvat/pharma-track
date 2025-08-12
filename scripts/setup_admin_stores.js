require('dotenv').config();
const { pool } = require('../config/database');

async function setupAdminStores() {
  try {
    console.log('=== Setting Up Admin Stores ===\n');
    
    // Check existing stores
    console.log('1. Checking existing stores:');
    const [existingStores] = await pool.execute('SELECT id, name, address FROM stores ORDER BY id');
    console.log(`   Current stores: ${existingStores.length}`);
    existingStores.forEach(store => {
      console.log(`   - ID ${store.id}: "${store.name}" - ${store.address}`);
    });
    
    // Check current admin user
    console.log('\n2. Checking demo admin:');
    const [adminUsers] = await pool.execute(`
      SELECT id, name, email, store_id, active_store_id 
      FROM users 
      WHERE role = 'admin'
    `);
    
    if (adminUsers.length === 0) {
      console.log('   ❌ No admin users found!');
      return;
    }
    
    const demoAdmin = adminUsers[0];
    console.log(`   Demo Admin: ID ${demoAdmin.id}, "${demoAdmin.name}" (${demoAdmin.email})`);
    console.log(`   Current store_id: ${demoAdmin.store_id}`);
    console.log(`   Current active_store_id: ${demoAdmin.active_store_id}`);
    
    // Create sample stores if needed
    const storesToCreate = [
      {
        name: 'North Branch Pharmacy', 
        address: '456 North Avenue, Northside, CA 90211',
        state: 'CA',
        zipcode: '90211', 
        phone: '5551234568',
        dea_registration_number: 'BA1234568',
        npi: '1234567891'
      },
      {
        name: 'South Branch Pharmacy',
        address: '789 South Boulevard, Southside, CA 90212', 
        state: 'CA',
        zipcode: '90212',
        phone: '5551234569',
        dea_registration_number: 'BA1234569',
        npi: '1234567892'
      },
      {
        name: 'East Branch Pharmacy',
        address: '321 East Main Street, Eastside, CA 90213', 
        state: 'CA',
        zipcode: '90213',
        phone: '5551234570',
        dea_registration_number: 'BA1234570',
        npi: '1234567893'
      }
    ];
    
    console.log('\n3. Creating demo stores:');
    const createdStores = [];
    
    for (const storeData of storesToCreate) {
      // Check if store already exists by name
      const [existing] = await pool.execute('SELECT id FROM stores WHERE name = ?', [storeData.name]);
      
      if (existing.length > 0) {
        console.log(`   ⚠️  Store "${storeData.name}" already exists (ID: ${existing[0].id})`);
        createdStores.push({ id: existing[0].id, name: storeData.name });
      } else {
        const [result] = await pool.execute(`
          INSERT INTO stores (name, address, state, zipcode, phone, dea_registration_number, npi) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          storeData.name, storeData.address, storeData.state, 
          storeData.zipcode, storeData.phone, storeData.dea_registration_number, storeData.npi
        ]);
        
        console.log(`   ✅ Created: "${storeData.name}" (ID: ${result.insertId})`);
        createdStores.push({ id: result.insertId, name: storeData.name });
      }
    }
    
    // Assign demo admin to the first store if not already assigned
    if (!demoAdmin.store_id || demoAdmin.store_id === 0) {
      const firstStore = createdStores[0];
      console.log(`\n4. Assigning demo admin to "${firstStore.name}" (ID: ${firstStore.id})`);
      
      await pool.execute(`
        UPDATE users 
        SET store_id = ?, active_store_id = ? 
        WHERE id = ?
      `, [firstStore.id, firstStore.id, demoAdmin.id]);
      
      console.log(`   ✅ Demo admin assigned to store ID ${firstStore.id}`);
    } else {
      console.log(`\n4. Demo admin already assigned to store ID ${demoAdmin.store_id}`);
    }
    
    // Show final store setup
    console.log('\n5. Final store setup:');
    const [finalStores] = await pool.execute('SELECT id, name, address FROM stores ORDER BY id');
    finalStores.forEach(store => {
      console.log(`   - ID ${store.id}: "${store.name}"`);
    });
    
    // Show admin assignment
    const [updatedAdmin] = await pool.execute(`
      SELECT u.id, u.name, u.store_id, s.name as store_name
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id
      WHERE u.role = 'admin'
    `);
    
    console.log('\n6. Admin store assignments:');
    updatedAdmin.forEach(admin => {
      console.log(`   - "${admin.name}": Store ${admin.store_id} (${admin.store_name || 'Unknown'})`);
    });
    
    console.log('\n=== Store Setup Complete ===');
    
  } catch (error) {
    console.error('❌ Setup error:', error);
  } finally {
    await pool.end();
  }
}

setupAdminStores();