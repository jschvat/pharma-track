#!/usr/bin/env node

/**
 * Test script for inventory transaction improvements
 * Tests proper SQL transaction handling and snapshot updates
 */

const StoreInventory = require('./models/StoreInventory');
const InventorySnapshot = require('./models/InventorySnapshot');
const { pool } = require('./config/database');

async function testTransactionRollback() {
  console.log('\n🧪 Testing transaction rollback scenarios...');
  
  try {
    // Test 1: Insufficient inventory should rollback
    console.log('\n1. Testing insufficient inventory rollback...');
    try {
      await StoreInventory.adjustStock(1, -1000, 'Test insufficient inventory', 1, 'prescription_fill');
      console.log('❌ ERROR: Should have failed due to insufficient inventory');
    } catch (error) {
      console.log('✅ SUCCESS: Correctly prevented negative inventory:', error.message);
    }
    
    // Test 2: Invalid inventory ID should rollback
    console.log('\n2. Testing invalid inventory ID rollback...');
    try {
      await StoreInventory.adjustStock(999999, 10, 'Test invalid ID', 1, 'shipment_received');
      console.log('❌ ERROR: Should have failed due to invalid inventory ID');
    } catch (error) {
      console.log('✅ SUCCESS: Correctly handled invalid inventory ID:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testSnapshotConsistency() {
  console.log('\n🔍 Testing inventory snapshot consistency...');
  
  try {
    // Get a test inventory item
    const [testInventory] = await pool.execute(
      'SELECT * FROM store_inventory WHERE is_active = TRUE LIMIT 1'
    );
    
    if (!testInventory.length) {
      console.log('⚠️ No active inventory items found for testing');
      return;
    }
    
    const inventory = testInventory[0];
    console.log(`Testing with inventory ID: ${inventory.id}, Store: ${inventory.store_id}, Drug: ${inventory.drug_id}`);
    
    // Get initial snapshot state
    const initialSnapshot = await InventorySnapshot.getByStore(inventory.store_id, {
      drugId: inventory.drug_id
    });
    
    const initialSnapshotQty = initialSnapshot.length > 0 ? initialSnapshot[0].quantity_on_hand : 0;
    const initialInventoryQty = inventory.quantity_on_hand;
    
    console.log(`Initial inventory quantity: ${initialInventoryQty}`);
    console.log(`Initial snapshot quantity: ${initialSnapshotQty}`);
    
    // Perform a stock adjustment
    const adjustment = 5;
    console.log(`\nPerforming stock adjustment: +${adjustment}`);
    
    const success = await StoreInventory.adjustStock(
      inventory.id, 
      adjustment, 
      'Test snapshot consistency', 
      1, 
      'shipment_received'
    );
    
    if (!success) {
      console.log('❌ Stock adjustment failed');
      return;
    }
    
    // Check updated quantities
    const [updatedInventory] = await pool.execute(
      'SELECT quantity_on_hand FROM store_inventory WHERE id = ?',
      [inventory.id]
    );
    
    const updatedSnapshot = await InventorySnapshot.getByStore(inventory.store_id, {
      drugId: inventory.drug_id
    });
    
    const finalInventoryQty = updatedInventory[0].quantity_on_hand;
    const finalSnapshotQty = updatedSnapshot.length > 0 ? updatedSnapshot[0].quantity_on_hand : 0;
    
    console.log(`Final inventory quantity: ${finalInventoryQty}`);
    console.log(`Final snapshot quantity: ${finalSnapshotQty}`);
    
    // Verify consistency
    const expectedQty = initialInventoryQty + adjustment;
    if (finalInventoryQty === expectedQty && finalSnapshotQty === expectedQty) {
      console.log('✅ SUCCESS: Inventory and snapshot are consistent');
    } else {
      console.log('❌ ERROR: Inventory and snapshot are inconsistent');
      console.log(`Expected: ${expectedQty}, Inventory: ${finalInventoryQty}, Snapshot: ${finalSnapshotQty}`);
    }
    
  } catch (error) {
    console.error('❌ Snapshot consistency test failed:', error);
  }
}

async function testTransactionTypes() {
  console.log('\n📋 Testing different transaction types...');
  
  try {
    // Get test inventory with sufficient quantity
    const [testInventory] = await pool.execute(`
      SELECT * FROM store_inventory 
      WHERE is_active = TRUE AND quantity_on_hand >= 10 
      LIMIT 1
    `);
    
    if (!testInventory.length) {
      console.log('⚠️ No inventory items with sufficient quantity found for testing');
      return;
    }
    
    const inventory = testInventory[0];
    console.log(`Testing with inventory ID: ${inventory.id}`);
    
    // Test different transaction types
    const tests = [
      { adjustment: 5, type: 'shipment_received', description: 'Shipment received' },
      { adjustment: -2, type: 'prescription_fill', description: 'Prescription fill' },
      { adjustment: 1, type: 'return_to_stock', description: 'Return to stock' },
      { adjustment: -1, type: 'expire', description: 'Medication expired' }
    ];
    
    for (const test of tests) {
      console.log(`\n${test.description}: ${test.adjustment > 0 ? '+' : ''}${test.adjustment}`);
      
      try {
        const success = await StoreInventory.adjustStock(
          inventory.id,
          test.adjustment,
          `Test ${test.description}`,
          1,
          test.type
        );
        
        if (success) {
          console.log(`✅ ${test.description} completed successfully`);
        } else {
          console.log(`❌ ${test.description} failed`);
        }
      } catch (error) {
        console.log(`❌ ${test.description} error:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Transaction type test failed:', error);
  }
}

async function testNewInventoryItem() {
  console.log('\n📦 Testing new inventory item creation...');
  
  try {
    // Create test inventory data
    const testData = {
      store_id: 1,
      drug_id: 1, // Assuming drug ID 1 exists
      quantity_on_hand: 50,
      reorder_level: 10,
      unit_cost: 5.99,
      selling_price: 12.99,
      lot_number: 'TEST-LOT-001',
      expiration_date: '2025-12-31',
      supplier: 'Test Supplier'
    };
    
    console.log('Creating new inventory item with initial quantity:', testData.quantity_on_hand);
    
    const inventoryId = await StoreInventory.add(testData, 1);
    
    if (inventoryId) {
      console.log(`✅ New inventory item created with ID: ${inventoryId}`);
      
      // Check if snapshot was updated
      const snapshot = await InventorySnapshot.getByStore(testData.store_id, {
        drugId: testData.drug_id
      });
      
      if (snapshot.length > 0) {
        console.log(`✅ Snapshot updated with quantity: ${snapshot[0].quantity_on_hand}`);
        console.log(`✅ Last transaction type: ${snapshot[0].last_transaction_type}`);
      } else {
        console.log('❌ Snapshot not found after creating inventory item');
      }
      
      // Clean up test data
      await pool.execute('DELETE FROM store_inventory WHERE id = ?', [inventoryId]);
      await pool.execute('DELETE FROM inventory_audit_log WHERE inventory_id = ?', [inventoryId]);
      await pool.execute(
        'DELETE FROM store_inventory_snapshot WHERE store_id = ? AND drug_id = ? AND last_transaction_type = ?',
        [testData.store_id, testData.drug_id, 'initial_inventory']
      );
      console.log('🧹 Test data cleaned up');
      
    } else {
      console.log('❌ Failed to create new inventory item');
    }
    
  } catch (error) {
    console.error('❌ New inventory item test failed:', error);
  }
}

async function runAllTests() {
  console.log('🚀 Starting inventory transaction tests...');
  
  try {
    await testTransactionRollback();
    await testSnapshotConsistency();
    await testTransactionTypes();
    await testNewInventoryItem();
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await pool.end();
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testTransactionRollback,
  testSnapshotConsistency,
  testTransactionTypes,
  testNewInventoryItem
};