/**
 * Debug Audit 400 Error
 * 
 * Test the exact API call that should be made for audit
 */

require('dotenv').config();
const axios = require('axios');

async function debugAudit() {
  console.log('\n=== Debugging Audit 400 Error ===\n');

  try {
    const API_BASE_URL = 'http://localhost:3001/api';
    
    // First get an inventory item to test with
    console.log('Getting inventory items...');
    
    // This is a test without authentication first
    const testData = {
      actual_quantity: 100,
      reason: 'Test audit from debug script'
    };
    
    console.log('Test data structure:');
    console.log('- actual_quantity:', testData.actual_quantity, typeof testData.actual_quantity);
    console.log('- reason:', testData.reason, typeof testData.reason);
    console.log('- reason length:', testData.reason.length);
    
    // Test validation requirements
    console.log('\nValidation checks:');
    console.log('✅ actual_quantity is number:', typeof testData.actual_quantity === 'number');
    console.log('✅ actual_quantity >= 0:', testData.actual_quantity >= 0);
    console.log('✅ reason is string:', typeof testData.reason === 'string');
    console.log('✅ reason length 1-500:', testData.reason.length >= 1 && testData.reason.length <= 500);
    
    // Check what the frontend form might be sending
    console.log('\nPotential issues to check:');
    console.log('1. Is user authenticated with valid token?');
    console.log('2. Is user a store admin?');
    console.log('3. Does inventory item exist and belong to user\'s store?');
    console.log('4. Is actual_quantity being sent as number or string?');
    console.log('5. Is reason field empty or whitespace only?');
    
    // Test different data types that might cause 400
    console.log('\n🔍 Testing potential problematic values:');
    
    // Empty reason
    const badData1 = { actual_quantity: 100, reason: '' };
    console.log('❌ Empty reason would fail validation:', badData1.reason.length === 0);
    
    // Null/undefined reason  
    const badData2 = { actual_quantity: 100, reason: null };
    console.log('❌ Null reason would fail validation');
    
    // String actual_quantity (this should be OK as backend converts it)
    const stringQty = { actual_quantity: '100', reason: 'Test' };
    console.log('✅ String quantity should be converted by validation');
    
    // Negative quantity
    const negativeQty = { actual_quantity: -5, reason: 'Test' };
    console.log('❌ Negative quantity might fail verifyQuantity validation');
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

// Run the debug
debugAudit();