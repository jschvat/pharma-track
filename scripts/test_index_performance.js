#!/usr/bin/env node

/**
 * Index Performance Testing Script
 * 
 * Tests the performance improvements from newly added database indexes
 */

const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'pharmatrak_user',
  password: process.env.DB_PASSWORD || 'pharmatrak_password',
  database: process.env.DB_NAME || 'pharmatrak'
};

async function testIndexPerformance() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('🚀 Testing Index Performance Improvements\n');
    
    // Test 1: Inventory low stock query
    console.log('📊 Test 1: Low Stock Inventory Query');
    console.time('low_stock_query');
    const [lowStock] = await connection.execute(`
      SELECT si.*, d.ndc, d.generic_name, d.brand_name 
      FROM store_inventory si 
      INNER JOIN drugs d ON si.drug_id = d.id 
      WHERE si.store_id = ? 
        AND si.is_active = TRUE 
        AND si.quantity_on_hand <= si.reorder_level 
      ORDER BY (si.quantity_on_hand / NULLIF(si.reorder_level, 0)) ASC 
      LIMIT 50
    `, [1]);
    console.timeEnd('low_stock_query');
    console.log(`   Found ${lowStock.length} low stock items\n`);
    
    // Test 2: Expiring items query
    console.log('📊 Test 2: Expiring Items Query');
    console.time('expiring_query');
    const [expiring] = await connection.execute(`
      SELECT si.*, d.ndc, d.generic_name, d.brand_name 
      FROM store_inventory si 
      INNER JOIN drugs d ON si.drug_id = d.id 
      WHERE si.store_id = ? 
        AND si.is_active = TRUE 
        AND si.expiration_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) 
      ORDER BY si.expiration_date ASC 
      LIMIT 50
    `, [1]);
    console.timeEnd('expiring_query');
    console.log(`   Found ${expiring.length} expiring items\n`);
    
    // Test 3: Audit log history query
    console.log('📊 Test 3: Audit Log History Query');
    console.time('audit_history_query');
    const [auditHistory] = await connection.execute(`
      SELECT ial.*, u.name as user_name, d.generic_name, d.brand_name 
      FROM inventory_audit_log ial 
      INNER JOIN users u ON ial.performed_by = u.id 
      INNER JOIN drugs d ON ial.drug_id = d.id 
      WHERE ial.store_id = ? 
      ORDER BY ial.transaction_date DESC 
      LIMIT 100
    `, [1]);
    console.timeEnd('audit_history_query');
    console.log(`   Found ${auditHistory.length} audit entries\n`);
    
    // Test 4: Drug search query
    console.log('📊 Test 4: Drug Search Query');
    console.time('drug_search_query');
    const [drugSearch] = await connection.execute(`
      SELECT * FROM drugs 
      WHERE is_active = TRUE 
        AND (generic_name LIKE ? OR brand_name LIKE ?) 
      ORDER BY generic_name 
      LIMIT 50
    `, ['%acetaminophen%', '%acetaminophen%']);
    console.timeEnd('drug_search_query');
    console.log(`   Found ${drugSearch.length} matching drugs\n`);
    
    // Test 5: Complex inventory query
    console.log('📊 Test 5: Complex Inventory Query');
    console.time('complex_inventory_query');
    const [complexInventory] = await connection.execute(`
      SELECT si.*, d.ndc, d.generic_name, d.brand_name, d.dosage_form, 
             d.strength, d.manufacturer_name 
      FROM store_inventory si 
      INNER JOIN drugs d ON si.drug_id = d.id 
      WHERE si.store_id = ? AND si.is_active = ? 
      ORDER BY d.generic_name, d.brand_name 
      LIMIT 20
    `, [1, true]);
    console.timeEnd('complex_inventory_query');
    console.log(`   Found ${complexInventory.length} inventory items\n`);
    
    // Show index statistics
    console.log('📋 Index Usage Analysis:');
    const [indexStats] = await connection.execute(`
      SELECT TABLE_NAME, INDEX_NAME, CARDINALITY 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = ? 
        AND INDEX_NAME LIKE 'idx_%' 
      ORDER BY TABLE_NAME, CARDINALITY DESC
    `, [dbConfig.database]);
    
    const tableStats = {};
    indexStats.forEach(stat => {
      if (!tableStats[stat.TABLE_NAME]) {
        tableStats[stat.TABLE_NAME] = [];
      }
      tableStats[stat.TABLE_NAME].push(stat);
    });
    
    Object.keys(tableStats).forEach(table => {
      console.log(`   ${table}:`);
      tableStats[table].slice(0, 3).forEach(idx => {
        console.log(`     ${idx.INDEX_NAME}: ${idx.CARDINALITY || 0} unique values`);
      });
    });
    
    console.log('\n✅ Performance testing completed!');
    
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    throw error;
    
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the performance test
if (require.main === module) {
  testIndexPerformance()
    .then(() => {
      console.log('\n🎯 Index performance testing finished successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Performance test error:', error.message);
      process.exit(1);
    });
}

module.exports = { testIndexPerformance };