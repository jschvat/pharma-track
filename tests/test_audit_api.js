/**
 * Test Audit API Direct Call
 * 
 * Make a direct API call to test the audit endpoint
 */

require('dotenv').config();
const axios = require('axios');
const { pool } = require('./config/database');

async function testAuditAPI() {
  console.log('\n=== Testing Audit API Direct Call ===\n');

  try {
    // Get a sample inventory item first
    const [inventoryRows] = await pool.execute(`
      SELECT si.*, d.brand_name
      FROM store_inventory si
      JOIN drugs d ON si.drug_id = d.id
      LIMIT 1
    `);

    if (inventoryRows.length === 0) {
      console.log('❌ No inventory items or users found');
      return;
    }

    const inventory = inventoryRows[0];
    console.log(`Testing audit for: ${inventory.brand_name}`);
    console.log(`Current quantity: ${inventory.quantity_on_hand}`);
    console.log(`Store ID: ${inventory.store_id}`);
    
    // First, we need to get a JWT token for the user
    console.log('\nStep 1: Authenticating user...');
    
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@pharmatrak.com', // Actual admin user
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Got authentication token');
    
    // Now test the audit API call
    console.log('\nStep 2: Making audit API call...');
    
    const auditData = {
      actual_quantity: inventory.quantity_on_hand + 5,
      reason: 'Test audit - fixed validation issue'
    };
    
    console.log('Sending audit data:', auditData);
    
    const response = await axios.post(
      `http://localhost:3001/api/inventory/${inventory.id}/audit`,
      auditData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Audit API call successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Audit API call failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await pool.end();
  }
}

testAuditAPI();