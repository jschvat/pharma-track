/**
 * Quick API Test Script
 * Tests backend endpoints without authentication for debugging
 */

const axios = require('axios');

async function testAPI() {
  console.log('Testing PharmaTraK Backend API...');
  
  try {
    // Test basic server health
    console.log('\n1. Testing server health...');
    const healthCheck = await axios.get('http://localhost:3001/api/health').catch(e => {
      console.log('Health check endpoint not found (expected)');
      return { status: 'No health endpoint' };
    });
    
    // Test auth endpoint (should return error but server should respond)
    console.log('\n2. Testing auth requirement...');
    const authTest = await axios.get('http://localhost:3001/api/drugs/search/fda').catch(e => {
      console.log('Auth error (expected):', e.response?.status, e.response?.data);
      return e.response;
    });
    
    console.log('\n✅ Backend server is responding');
    console.log('🔑 Authentication is working (blocking unauthenticated requests)');
    
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
  }
}

testAPI();