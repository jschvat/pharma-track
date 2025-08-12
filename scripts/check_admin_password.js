require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

async function checkAdminPassword() {
  try {
    const [users] = await pool.execute('SELECT id, email, password FROM users WHERE email = ?', ['admin@pharmatrak.com']);
    
    if (users.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }
    
    const admin = users[0];
    console.log('Admin user found:', admin.email);
    
    // Test if Admin123! matches the hash
    const isMatch = await bcrypt.compare('Admin123!', admin.password);
    console.log('Password Admin123! matches:', isMatch);
    
    // Try other common passwords
    const testPasswords = ['admin', 'password', 'admin@pharmatrak.com'];
    for (const pwd of testPasswords) {
      const match = await bcrypt.compare(pwd, admin.password);
      console.log(`Password "${pwd}" matches:`, match);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAdminPassword();