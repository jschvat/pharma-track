/**
 * Complete Database Setup Script
 * 
 * A comprehensive script that sets up the entire PharmaTraK database including:
 * - Main schema creation
 * - All migrations and enhancements
 * - Indexes and triggers
 * - Sample data population
 * - Admin user creation
 * 
 * This is the single script to set up everything from scratch.
 * 
 * Usage:
 * DB_HOST=localhost DB_USER=pharmatrak_user DB_PASSWORD=pharmatrak_password DB_NAME=pharmatrak node scripts/setup_complete_database.js
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'pharmatrak_user',
  password: process.env.DB_PASSWORD || 'pharmatrak_password',
  database: process.env.DB_NAME || 'pharmatrak',
  multipleStatements: true
};

// SQL files to execute in order
const setupFiles = [
  // Core schema
  { file: '../database/schema.sql', description: 'Core database schema' },
  { file: '../database/drug_schema.sql', description: 'Drug and inventory schema' },
  
  // Migrations (in dependency order)
  { file: '../database/migrations/add_multi_store_support.sql', description: 'Multi-store support' },
  { file: '../database/migrations/remove_audit_columns.sql', description: 'Remove deprecated audit columns' },
  { file: '../database/migrations/add_inventory_snapshot.sql', description: 'Inventory snapshot system' },
  { file: '../database/migrations/add_inventory_triggers.sql', description: 'Inventory automation triggers' },
  { file: '../database/migrations/add_performance_indexes.sql', description: 'Performance optimization indexes' },
  { file: '../database/migrations/add_inventory_snapshot_history_simple.sql', description: 'Inventory snapshot history' },
  { file: '../database/migrations/add_god_mode_user.sql', description: 'God mode user support' }
];

/**
 * Execute a SQL file
 */
async function executeSQLFile(connection, filePath, description) {
  try {
    console.log(`📁 Executing: ${description}`);
    const fullPath = path.join(__dirname, filePath);
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch (error) {
      console.log(`⚠️  File not found: ${filePath} - skipping`);
      return true;
    }
    
    const sql = await fs.readFile(fullPath, 'utf8');
    
    // Split by semicolon and execute each statement separately for better error handling
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
        } catch (error) {
          // Some errors are expected (like table already exists)
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
              error.code === 'ER_DUP_KEYNAME' ||
              error.code === 'ER_DUP_KEY' ||
              error.message.includes('already exists')) {
            console.log(`   ⚠️  Already exists (skipping): ${error.message.split(' ')[0]}`);
          } else {
            console.error(`   ❌ SQL Error in statement: ${statement.substring(0, 100)}...`);
            throw error;
          }
        }
      }
    }
    
    console.log(`   ✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to execute ${description}:`, error.message);
    return false;
  }
}

/**
 * Create default admin user
 */
async function createAdminUser(connection) {
  try {
    console.log('👤 Creating default admin user...');
    
    // Check if admin user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['admin@pharmatrak.com']
    );
    
    if (existingUsers.length > 0) {
      console.log('   ⚠️  Admin user already exists, updating password...');
      const hashedPassword = await bcrypt.hash('Admin123!', 12);
      await connection.execute(
        'UPDATE users SET password = ?, role = ? WHERE email = ?',
        [hashedPassword, 'god_mode', 'admin@pharmatrak.com']
      );
    } else {
      console.log('   ➕ Creating new admin user...');
      const hashedPassword = await bcrypt.hash('Admin123!', 12);
      
      await connection.execute(`
        INSERT INTO users (name, email, phone, password, address, store_id, role, is_active, date_created)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        'System Administrator',
        'admin@pharmatrak.com',
        '5551234567',
        hashedPassword,
        '123 Admin Street, Admin City, CA 90210',
        1,
        'god_mode',
        true
      ]);
    }
    
    console.log('   ✅ Admin user ready');
    console.log('      Email: admin@pharmatrak.com');
    console.log('      Password: Admin123!');
    return true;
  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    return false;
  }
}

/**
 * Create sample stores if none exist
 */
async function createSampleStores(connection) {
  try {
    console.log('🏪 Setting up sample stores...');
    
    const [existingStores] = await connection.execute('SELECT COUNT(*) as count FROM stores');
    
    if (existingStores[0].count === 0) {
      console.log('   ➕ Creating sample stores...');
      
      const stores = [
        {
          name: 'Main Pharmacy',
          address: '123 Main Street',
          city: 'Springfield',
          state: 'IL',
          zipcode: '62701',
          phone: '5551234567',
          dea_registration_number: 'AB1234567',
          npi: '1234567890'
        },
        {
          name: 'Downtown Pharmacy',
          address: '456 Oak Avenue',
          city: 'Springfield',
          state: 'IL', 
          zipcode: '62702',
          phone: '5559876543',
          dea_registration_number: 'CD2345678',
          npi: '0987654321'
        }
      ];
      
      for (const store of stores) {
        await connection.execute(`
          INSERT INTO stores (name, address, city, state, zipcode, phone, dea_registration_number, npi)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [store.name, store.address, store.city, store.state, store.zipcode, store.phone, store.dea_registration_number, store.npi]);
      }
      
      console.log(`   ✅ Created ${stores.length} sample stores`);
    } else {
      console.log(`   ℹ️  Found ${existingStores[0].count} existing stores`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create sample stores:', error.message);
    return false;
  }
}

/**
 * Verify database setup
 */
async function verifySetup(connection) {
  try {
    console.log('🔍 Verifying database setup...');
    
    // Check main tables
    const tables = [
      'users', 'stores', 'drugs', 'store_inventory', 
      'inventory_audit_log', 'store_inventory_snapshot',
      'store_inventory_snapshot_history'
    ];
    
    const [existingTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [dbConfig.database]);
    
    const tableNames = existingTables.map(row => row.TABLE_NAME);
    
    console.log('   📋 Table Status:');
    for (const table of tables) {
      if (tableNames.includes(table)) {
        const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`      ✅ ${table} (${count[0].count} records)`);
      } else {
        console.log(`      ❌ ${table} - MISSING`);
      }
    }
    
    // Check indexes
    const [indexes] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = ? AND INDEX_NAME LIKE 'idx_%'
    `, [dbConfig.database]);
    
    console.log(`   📊 Performance indexes: ${indexes[0].count}`);
    
    // Check triggers
    const [triggers] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TRIGGERS 
      WHERE TRIGGER_SCHEMA = ?
    `, [dbConfig.database]);
    
    console.log(`   ⚡ Triggers: ${triggers[0].count}`);
    
    console.log('   ✅ Database verification completed');
    return true;
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    return false;
  }
}

/**
 * Main setup function
 */
async function setupCompleteDatabase() {
  let connection;
  
  try {
    console.log('🚀 Starting Complete Database Setup...\n');
    console.log('Database Configuration:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log(`   Database: ${dbConfig.database}\n`);
    
    // Connect to database
    console.log('📡 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected successfully\n');
    
    // Execute all setup files
    console.log('📚 Executing database setup files...\n');
    let successCount = 0;
    let totalCount = setupFiles.length;
    
    for (const { file, description } of setupFiles) {
      const success = await executeSQLFile(connection, file, description);
      if (success) successCount++;
    }
    
    console.log(`\n📊 Setup Files Summary: ${successCount}/${totalCount} completed\n`);
    
    // Create admin user
    await createAdminUser(connection);
    console.log('');
    
    // Create sample stores
    await createSampleStores(connection);
    console.log('');
    
    // Verify setup
    await verifySetup(connection);
    
    console.log('\n🎉 Complete Database Setup Finished!');
    console.log('═══════════════════════════════════════\n');
    
    console.log('🔐 Login Credentials:');
    console.log('   Email: admin@pharmatrak.com');
    console.log('   Password: Admin123!\n');
    
    console.log('🔗 API Endpoints Available:');
    console.log('   Health Check: GET /api/health');
    console.log('   Login: POST /api/auth/login');
    console.log('   Inventory: GET /api/inventory/store/{id}');
    console.log('   Snapshot History: GET /api/inventory-snapshot-history/store/{id}/drug/{id}');
    console.log('   And many more...\n');
    
    console.log('🛠️  Next Steps:');
    console.log('   1. Start backend: node server.js');
    console.log('   2. Start frontend: cd frontend && npm start');
    console.log('   3. Access app: http://localhost:3001\n');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('📡 Database connection closed');
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  setupCompleteDatabase();
}

module.exports = { setupCompleteDatabase };