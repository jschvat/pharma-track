require('dotenv').config();
const { pool } = require('./config/database');

async function checkExistingUsers() {
  try {
    console.log('=== Existing Users ===\n');
    
    const [users] = await pool.execute('SELECT id, name, email, role FROM users');
    
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Name: "${user.name}", Email: ${user.email}, Role: ${user.role}`);
    });
    
    console.log(`\nTotal users: ${users.length}`);
    
    // Check for the specific email we're trying to use
    const testEmail = 'testadmin2@example.com';
    const [existing] = await pool.execute('SELECT * FROM users WHERE email = ?', [testEmail]);
    
    if (existing.length > 0) {
      console.log(`\n❌ Email ${testEmail} already exists!`);
      console.log('Existing user:', existing[0]);
    } else {
      console.log(`\n✅ Email ${testEmail} is available`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkExistingUsers();