/**
 * Test Audit Error
 * 
 * Tests the audit transaction API call to identify the error
 */

require('dotenv').config();
const { pool } = require('./config/database');
const StoreInventory = require('./models/StoreInventory');

async function testAuditError() {
  console.log('\n=== Testing Audit Transaction ===\n');

  try {
    // Get a sample inventory item
    const [inventoryRows] = await pool.execute(`
      SELECT si.*, d.brand_name
      FROM store_inventory si
      JOIN drugs d ON si.drug_id = d.id
      LIMIT 1
    `);

    if (inventoryRows.length === 0) {
      console.log('❌ No inventory items found');
      return;
    }

    const inventory = inventoryRows[0];
    console.log(`Testing audit for: ${inventory.brand_name}`);
    console.log(`Current quantity: ${inventory.quantity_on_hand}`);
    
    // Test audit with a different quantity
    const actualQuantity = inventory.quantity_on_hand + 5;
    const reason = 'Test audit transaction';
    const performedBy = 1; // Assuming user ID 1 exists

    console.log(`Attempting audit: ${inventory.quantity_on_hand} → ${actualQuantity}`);

    // Call the audit function directly
    const result = await StoreInventory.auditInventory(
      inventory.id,
      actualQuantity,
      reason,
      performedBy
    );

    if (result) {
      console.log('✅ Audit completed successfully!');
      
      // Check the updated inventory
      const [updatedRows] = await pool.execute('SELECT quantity_on_hand FROM store_inventory WHERE id = ?', [inventory.id]);
      console.log(`Updated quantity: ${updatedRows[0].quantity_on_hand}`);
      
      // Check audit log entry
      const [auditRows] = await pool.execute(`
        SELECT * FROM inventory_audit_log 
        WHERE inventory_id = ? 
        ORDER BY transaction_date DESC 
        LIMIT 1
      `, [inventory.id]);
      
      if (auditRows.length > 0) {
        const audit = auditRows[0];
        console.log(`Audit log: ${audit.quantity_before} → ${audit.quantity_after} (${audit.quantity_change})`);
        console.log(`Reason: ${audit.reason}`);
      }
    } else {
      console.log('❌ Audit failed');
    }

  } catch (error) {
    console.error('❌ Audit error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run the test
testAuditError();