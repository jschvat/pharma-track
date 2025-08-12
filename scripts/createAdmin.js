const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const createAdminUser = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'pharmatrak'
  });

  try {
    console.log('🔐 Creating admin user for PharmaTraK...\n');

    // Hash the password
    const plainPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create default store first
    const storeData = [
      'PharmaTraK Demo Store',
      '123 Main Street',
      'CA',
      '90210',
      '5551234567',
      '5551234568',
      'AB1234567',
      '1234567890'
    ];

    const [storeResult] = await connection.execute(`
      INSERT INTO stores (
        name, address, state, zipcode, phone, fax, 
        dea_registration_number, npi
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        name = VALUES(name),
        address = VALUES(address)
    `, storeData);

    let storeId;
    if (storeResult.insertId) {
      storeId = storeResult.insertId;
    } else {
      // Get existing store ID
      const [existingStore] = await connection.execute(
        'SELECT id FROM stores WHERE dea_registration_number = ?',
        ['AB1234567']
      );
      storeId = existingStore[0].id;
    }

    // Create admin user
    const userData = [
      'Demo Admin',
      'admin@pharmatrak.com',
      '5551234567',
      hashedPassword,
      '123 Admin Lane, Beverly Hills, CA',
      storeId,
      'admin',
      true
    ];

    await connection.execute(`
      INSERT INTO users (
        name, email, phone, password, address, store_id, role, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        name = VALUES(name),
        phone = VALUES(phone),
        address = VALUES(address),
        store_id = VALUES(store_id),
        role = VALUES(role),
        is_active = VALUES(is_active),
        password = VALUES(password)
    `, userData);

    // Update store admin_user_id
    await connection.execute(`
      UPDATE stores 
      SET admin_user_id = (SELECT id FROM users WHERE email = 'admin@pharmatrak.com')
      WHERE id = ?
    `, [storeId]);

    console.log('✅ Admin user created successfully!\n');
    console.log('📧 LOGIN CREDENTIALS:');
    console.log('   Email:    admin@pharmatrak.com');
    console.log('   Password: Admin123!');
    console.log('\n🏪 DEMO STORE:');
    console.log('   Name: PharmaTraK Demo Store');
    console.log('   DEA:  AB1234567');
    console.log('   NPI:  1234567890');
    console.log('\n🌐 Frontend URL: http://localhost:3001');
    console.log('🔧 Backend API: http://localhost:3001');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await connection.end();
  }
};

// Run if called directly
if (require.main === module) {
  createAdminUser();
}

module.exports = createAdminUser;