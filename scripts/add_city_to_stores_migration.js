const mysql = require('mysql2/promise');

async function addCityToStores() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'pharmatrak_user',
    password: process.env.DB_PASSWORD || 'pharmatrak_password',
    database: process.env.DB_NAME || 'pharmatrak'
  });

  try {
    console.log('🏙️ Adding city column to stores table...');
    
    // Add city column after address field
    await connection.execute(`
      ALTER TABLE stores 
      ADD COLUMN city VARCHAR(100) NULL 
      AFTER address
    `);
    
    console.log('✅ Successfully added city column to stores table');
    
    // Show updated schema
    console.log('\n📋 Updated stores table schema:');
    const [columns] = await connection.execute('DESCRIBE stores');
    console.table(columns);
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ City column already exists in stores table');
      
      // Show current schema
      const [columns] = await connection.execute('DESCRIBE stores');
      console.table(columns);
    } else {
      console.error('❌ Error adding city column:', error.message);
      throw error;
    }
  } finally {
    await connection.end();
  }
}

addCityToStores().catch(console.error);