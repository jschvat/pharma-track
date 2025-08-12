require('dotenv').config();
const { pool } = require('./config/database');

async function checkUsers() {
  try {
    const [users] = await pool.execute('SELECT id, email, name, role, store_id FROM users');
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}, Store: ${user.store_id}`);
    });
    
    const [inventory] = await pool.execute('SELECT COUNT(*) as count FROM store_inventory');
    console.log(`\nInventory items: ${inventory[0].count}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();