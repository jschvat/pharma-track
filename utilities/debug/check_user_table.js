require('dotenv').config();
const { pool } = require('./config/database');

async function checkUserTable() {
  try {
    const [columns] = await pool.execute('DESCRIBE users');
    console.log('User table structure:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'required'})`);
    });
    
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', ['admin@pharmatrak.com']);
    if (users.length > 0) {
      console.log('\nAdmin user data:');
      console.log(users[0]);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserTable();