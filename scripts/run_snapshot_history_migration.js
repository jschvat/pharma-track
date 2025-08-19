/**
 * Inventory Snapshot History Migration Script
 * 
 * Runs the database migration to add inventory snapshot history functionality.
 * This script safely applies the new schema and populates initial data.
 * 
 * Features:
 * - Creates snapshot history table
 * - Adds enhanced views and stored procedures
 * - Updates triggers for automatic history tracking
 * - Populates initial history from existing audit log
 * - Validates migration success
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
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

/**
 * Run the inventory snapshot history migration
 */
async function runMigration() {
  let connection;
  
  try {
    console.log('🚀 Starting Inventory Snapshot History Migration...\n');
    
    // Connect to database
    console.log('📡 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully\n');
    
    // Read migration file
    console.log('📁 Reading migration file...');
    const migrationPath = path.join(__dirname, '../database/migrations/add_inventory_snapshot_history_simple.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    console.log('✅ Migration file loaded successfully\n');
    
    // Check current state
    console.log('🔍 Checking current database state...');
    await checkCurrentState(connection);
    
    // Execute migration
    console.log('⚡ Executing migration...');
    await connection.execute(migrationSQL);
    console.log('✅ Migration executed successfully\n');
    
    // Validate migration
    console.log('🔬 Validating migration...');
    await validateMigration(connection);
    
    // Show summary
    await showMigrationSummary(connection);
    
    console.log('🎉 Inventory Snapshot History Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('📡 Database connection closed');
    }
  }
}

/**
 * Check current database state before migration
 */
async function checkCurrentState(connection) {
  try {
    // Check if snapshot history table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'store_inventory_snapshot_history'
    `, [dbConfig.database]);
    
    if (tables.length > 0) {
      console.log('⚠️  Snapshot history table already exists');
      
      // Check record count
      const [countResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM store_inventory_snapshot_history'
      );
      console.log(`   Current records: ${countResult[0].count}`);
    } else {
      console.log('ℹ️  Snapshot history table does not exist (will be created)');
    }
    
    // Check audit log records
    const [auditCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM inventory_audit_log'
    );
    console.log(`ℹ️  Available audit log records: ${auditCount[0].count}`);
    
    // Check current snapshot records
    const [snapshotCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM store_inventory_snapshot'
    );
    console.log(`ℹ️  Current snapshot records: ${snapshotCount[0].count}`);
    
    console.log('✅ Current state check completed\n');
    
  } catch (error) {
    console.warn('⚠️  Could not check current state:', error.message);
  }
}

/**
 * Validate migration success
 */
async function validateMigration(connection) {
  const validations = [];
  
  try {
    // 1. Check if history table was created
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'store_inventory_snapshot_history'
    `, [dbConfig.database]);
    
    if (tables.length > 0) {
      validations.push('✅ Snapshot history table created');
    } else {
      validations.push('❌ Snapshot history table NOT created');
    }
    
    // 2. Check if views were created
    const [views] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.VIEWS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('v_inventory_snapshot_last5', 'v_current_inventory_enhanced')
    `, [dbConfig.database]);
    
    validations.push(`✅ Views created: ${views.length}/2`);
    
    // 3. Check if stored procedure was created
    const [procedures] = await connection.execute(`
      SELECT ROUTINE_NAME 
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_SCHEMA = ? AND ROUTINE_NAME = 'UpdateInventorySnapshotWithHistory'
    `, [dbConfig.database]);
    
    if (procedures.length > 0) {
      validations.push('✅ Enhanced stored procedure created');
    } else {
      validations.push('❌ Enhanced stored procedure NOT created');
    }
    
    // 4. Check if trigger was updated
    const [triggers] = await connection.execute(`
      SELECT TRIGGER_NAME 
      FROM INFORMATION_SCHEMA.TRIGGERS 
      WHERE TRIGGER_SCHEMA = ? AND TRIGGER_NAME = 'after_inventory_audit_insert_with_history'
    `, [dbConfig.database]);
    
    if (triggers.length > 0) {
      validations.push('✅ Enhanced trigger created');
    } else {
      validations.push('⚠️  Enhanced trigger not found (may use old trigger)');
    }
    
    // 5. Check if history records were populated
    const [historyCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM store_inventory_snapshot_history'
    );
    
    if (historyCount[0].count > 0) {
      validations.push(`✅ History records populated: ${historyCount[0].count}`);
    } else {
      validations.push('⚠️  No history records populated (may be expected if no recent audit data)');
    }
    
    // 6. Test a view query
    try {
      const [testView] = await connection.execute(
        'SELECT COUNT(*) as count FROM v_inventory_snapshot_last5 LIMIT 1'
      );
      validations.push('✅ Views are queryable');
    } catch (error) {
      validations.push('❌ Views are NOT queryable: ' + error.message);
    }
    
    // Print validation results
    console.log('Validation Results:');
    validations.forEach(validation => console.log(`  ${validation}`));
    console.log('');
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
  }
}

/**
 * Show migration summary
 */
async function showMigrationSummary(connection) {
  try {
    console.log('📊 Migration Summary:');
    console.log('═══════════════════\n');
    
    // History table statistics
    const [historyStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT store_id) as unique_stores,
        COUNT(DISTINCT drug_id) as unique_drugs,
        MIN(snapshot_date) as earliest_snapshot,
        MAX(snapshot_date) as latest_snapshot
      FROM store_inventory_snapshot_history
    `);
    
    if (historyStats[0].total_records > 0) {
      const stats = historyStats[0];
      console.log(`📈 History Table Statistics:`);
      console.log(`   Total Records: ${stats.total_records}`);
      console.log(`   Unique Stores: ${stats.unique_stores}`);
      console.log(`   Unique Drugs: ${stats.unique_drugs}`);
      console.log(`   Date Range: ${stats.earliest_snapshot} to ${stats.latest_snapshot}`);
    } else {
      console.log(`📈 History Table: Empty (no recent audit data to populate)`);
    }
    
    // Transaction type breakdown
    const [typeBreakdown] = await connection.execute(`
      SELECT 
        transaction_type,
        COUNT(*) as count
      FROM store_inventory_snapshot_history
      GROUP BY transaction_type
      ORDER BY count DESC
    `);
    
    if (typeBreakdown.length > 0) {
      console.log(`\n📋 Transaction Type Breakdown:`);
      typeBreakdown.forEach(type => {
        console.log(`   ${type.transaction_type}: ${type.count} records`);
      });
    }
    
    // Show available API endpoints
    console.log(`\n🔗 New API Endpoints Available:`);
    console.log(`   GET /api/inventory-snapshot-history/store/{id}/drug/{id} - Get drug history`);
    console.log(`   GET /api/inventory-snapshot-history/store/{id}/bulk - Get multiple drugs history`);
    console.log(`   GET /api/inventory-snapshot-history/store/{id}/summary - Get change summary`);
    console.log(`   GET /api/inventory-snapshot-history/store/{id}/most-active - Get most active drugs`);
    console.log(`   GET /api/inventory-snapshot-history/transaction-types - Get transaction types`);
    
    console.log(`\n📚 New Database Objects:`);
    console.log(`   Table: store_inventory_snapshot_history - Maintains last 5 snapshots per drug`);
    console.log(`   View: v_inventory_snapshot_last5 - Easy access to last 5 snapshots`);
    console.log(`   View: v_current_inventory_enhanced - Enhanced current inventory with descriptions`);
    console.log(`   Procedure: UpdateInventorySnapshotWithHistory - Manages snapshot updates`);
    console.log(`   Trigger: after_inventory_audit_insert_with_history - Auto-updates history`);
    
    console.log('');
    
  } catch (error) {
    console.warn('⚠️  Could not generate summary:', error.message);
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };