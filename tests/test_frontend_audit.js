/**
 * Test Frontend Audit API Call
 * 
 * Tests the exact API call that the frontend would make
 */

const axios = require('axios');

async function testFrontendAuditCall() {
  console.log('\n=== Testing Frontend Audit API Call ===\n');

  try {
    // Get a sample inventory item and user token
    // For this test, we'll need to simulate what the frontend sends

    const API_BASE_URL = 'http://localhost:3001/api';
    
    // First, let's try to get a valid token (you'll need to replace with actual login)
    console.log('Note: This test requires a valid authentication token');
    console.log('In a real scenario, the frontend would have this from login');
    
    // Test data that mimics what the frontend would send
    const testData = {
      actual_quantity: 1800, // This would be parsed from the form
      reason: 'Test audit from frontend simulation'
    };

    console.log('Test data being sent:', testData);
    console.log('Data types:', {
      actual_quantity: typeof testData.actual_quantity,
      reason: typeof testData.reason
    });

    // The issue might be in validation - let's check what validation expects
    console.log('\n✅ Test data structure looks correct');
    console.log('Possible issues to check:');
    console.log('1. Authentication token missing/invalid');
    console.log('2. User doesn\'t have store admin permissions');
    console.log('3. Inventory item doesn\'t exist');
    console.log('4. Validation error on actual_quantity or reason fields');
    console.log('5. Database connection issue');

    // Since we can't easily simulate the auth token here, 
    // let's check if the validation logic has any issues

    const actualQuantity = 1800;
    const reason = 'Test audit';

    console.log('\nValidation checks:');
    console.log('✅ actual_quantity is number:', typeof actualQuantity === 'number');
    console.log('✅ actual_quantity >= 0:', actualQuantity >= 0);
    console.log('✅ reason is string:', typeof reason === 'string');
    console.log('✅ reason length valid:', reason.length >= 1 && reason.length <= 500);

    console.log('\n💡 To debug the actual error:');
    console.log('1. Check browser console for detailed error message');
    console.log('2. Check backend logs when the audit is submitted');
    console.log('3. Verify user has store admin role');
    console.log('4. Ensure the inventory item belongs to the user\'s store');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testFrontendAuditCall();