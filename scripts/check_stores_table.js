require('dotenv').config();
const { pool } = require('../config/database');

async function checkStoresTable() {
  try {
    console.log('=== Checking Stores Table Structure ===\n');
    
    // Check table structure
    const [columns] = await pool.execute('DESCRIBE stores');
    console.log('Stores table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}${col.Key ? ' ' + col.Key : ''}${col.Default ? ' DEFAULT ' + col.Default : ''}`);
    });
    
    // Check existing stores
    console.log('\nExisting stores:');
    const [stores] = await pool.execute('SELECT * FROM stores LIMIT 5');
    console.log(`   Count: ${stores.length}`);
    stores.forEach(store => {
      console.log(`   - ID ${store.id}: "${store.name}"`);
      console.log(`     Address: ${store.address}`);
      console.log(`     Phone: ${store.phone}`);
      console.log(`     DEA: ${store.dea_registration_number}`);
      console.log(`     NPI: ${store.npi}`);
    });
    
  } catch (error) {
    console.error('❌ Check error:', error);
  } finally {
    await pool.end();
  }
}

checkStoresTable();