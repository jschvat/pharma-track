#!/usr/bin/env node

/**
 * Performance Indexes Migration Script
 * 
 * Applies strategic database indexes to improve query performance
 * for frequently used operations in PharmaTraK.
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'pharmatrak_user',
  password: process.env.DB_PASSWORD || 'pharmatrak_password',
  database: process.env.DB_NAME || 'pharmatrak',
  multipleStatements: true
};

async function runPerformanceIndexes() {
  let connection;
  
  try {
    console.log('🚀 Starting Performance Indexes Migration...\n');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/add_performance_indexes.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    console.log('📄 Loaded migration file');
    
    // Split SQL statements and clean them up
    const statements = migrationSQL
      .split(';')
      .map(stmt => {
        // Remove single-line comments (-- comments)
        return stmt.split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .filter(line => line.trim().length > 0)
          .join('\n')
          .trim();
      })
      .filter(stmt => stmt.length > 0)
      .filter(stmt => stmt.includes('CREATE INDEX')); // Only CREATE INDEX statements
    
    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    let successCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Extract index name for reporting
      const indexMatch = statement.match(/CREATE INDEX.*?(\w+)\s+ON/i);
      const indexName = indexMatch ? indexMatch[1] : `Statement ${i + 1}`;
      
      try {
        console.log(`⏳ Creating index: ${indexName}`);
        
        await connection.execute(statement);
        console.log(`✅ Successfully created: ${indexName}`);
        successCount++;
        
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME' || error.message.includes('already exists')) {
          console.log(`⚠️  Index already exists: ${indexName} (skipping)`);
          skipCount++;
        } else {
          console.error(`❌ Failed to create index: ${indexName}`);
          console.error(`   Error: ${error.message}`);
          throw error;
        }
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully created: ${successCount} indexes`);
    console.log(`   ⚠️  Already existed: ${skipCount} indexes`);
    console.log(`   📈 Total processed: ${successCount + skipCount} indexes`);
    
    // Show current index count
    console.log('\n📋 Verifying indexes...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, COUNT(*) as INDEX_COUNT 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = ?
      GROUP BY TABLE_NAME
      ORDER BY TABLE_NAME
    `, [dbConfig.database]);
    
    tables.forEach(table => {
      console.log(`   ${table.TABLE_NAME}: ${table.INDEX_COUNT} indexes`);
    });
    
    console.log('\n🎉 Performance indexes migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
if (require.main === module) {
  runPerformanceIndexes()
    .then(() => {
      console.log('\n✨ All done! Your database should now have improved query performance.');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error.message);
      process.exit(1);
    });
}

module.exports = { runPerformanceIndexes };