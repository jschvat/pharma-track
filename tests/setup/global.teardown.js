/**
 * Global Test Teardown
 * 
 * Runs once after all tests complete.
 * Cleans up test database and environment.
 */

const mysql = require('mysql2/promise');

module.exports = async () => {
  try {
    console.log('🧹 Cleaning up test environment...');
    
    // Only clean up in test environment
    if (process.env.NODE_ENV !== 'test') {
      console.log('⚠️  Skipping cleanup - not in test environment');
      return;
    }
    
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'pharmatrak_user',
      password: process.env.DB_PASSWORD || 'pharmatrak_password'
    };
    
    const testDbName = process.env.DB_NAME_TEST || 'pharmatrak_test';
    
    // Connect to MySQL server
    const connection = await mysql.createConnection(dbConfig);
    
    // Option 1: Drop the entire test database (clean slate for next run)
    if (process.env.CLEANUP_STRATEGY === 'drop') {
      await connection.execute(`DROP DATABASE IF EXISTS \`${testDbName}\``);
      console.log(`✅ Test database '${testDbName}' dropped`);
    } 
    // Option 2: Clear test data but keep schema (default)
    else {
      await connection.execute(`USE \`${testDbName}\``);
      
      // Disable foreign key checks for cleanup
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
      
      // Clear test data from tables (in reverse dependency order)
      const tablesToClean = [
        'inventory_audit_log',
        'store_inventory', 
        'drugs',
        'users',
        'stores'
      ];
      
      for (const table of tablesToClean) {
        try {
          await connection.execute(`DELETE FROM ${table} WHERE id > 0`);
        } catch (error) {
          // Table might not exist, continue
          console.log(`⚠️  Could not clean table ${table}: ${error.message}`);
        }
      }
      
      // Re-enable foreign key checks
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log('✅ Test data cleaned up');
    }
    
    await connection.end();
    
    console.log('🎯 Test environment cleanup complete');
    
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error.message);
    // Don't throw error during cleanup to avoid masking test failures
  }
};