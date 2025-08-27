#!/usr/bin/env node

/**
 * Test Exact NDC Search Endpoint
 * Tests the new /api/drugs/labeling/search/ndc-exact endpoint
 */

const axios = require('axios');

async function testExactNDCSearch() {
  console.log('🧪 Testing Exact NDC Search Endpoint\n');
  
  // Test NDCs - mix of known working NDCs from our previous tests
  const testNDCs = [
    '15631-0404-0',  // Known working NDC from our successful test
    '15631-0404',    // Product NDC version
    '63941-519-15',  // Package NDC from acetaminophen test
    '63941-519',     // Product NDC version
    '59779-438-12',  // Package NDC from ibuprofen test
    '59779-438',     // Product NDC version
    '00003-0232-21', // NDC from our database (should fail)
  ];
  
  let successCount = 0;
  let totalCount = testNDCs.length;
  
  // First get a JWT token for authentication
  console.log('🔐 Getting authentication token...');
  let authToken;
  try {
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@pharmatrak.com',
      password: 'Admin123!'
    });
    authToken = loginResponse.data.token;
    console.log('✅ Authentication successful\n');
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    return;
  }
  
  for (const testNDC of testNDCs) {
    console.log(`🔍 Testing Exact NDC: "${testNDC}"`);
    console.log('=' .repeat(60));
    
    try {
      const startTime = Date.now();
      const response = await axios.get(`http://localhost:3001/api/drugs/labeling/search/ndc-exact`, {
        params: { ndc: testNDC, limit: 1 },
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const responseTime = Date.now() - startTime;
      
      if (response.data.success) {
        const data = response.data;
        console.log(`✅ SUCCESS for Exact NDC: "${testNDC}"`);
        console.log(`   ⚡ Response time: ${responseTime}ms`);
        console.log(`   📊 Results found: ${data.results_count}`);
        console.log(`   🏷️  Field used: ${data.field_used}`);
        console.log(`   🏷️  Generic name: ${data.labeling_data.product_info.generic_name || 'N/A'}`);
        console.log(`   🏷️  Brand name: ${data.labeling_data.product_info.brand_name || 'N/A'}`);
        console.log(`   🏷️  Manufacturer: ${data.labeling_data.product_info.manufacturer || 'N/A'}`);
        console.log(`   📦 Package NDCs: ${data.labeling_data.ndc_info.package_ndcs?.join(', ') || 'N/A'}`);
        console.log(`   📦 Product NDCs: ${data.labeling_data.ndc_info.product_ndcs?.join(', ') || 'N/A'}`);
        console.log(`   🎯 Exact match: ${data.search_info.exact_match ? '✅ Yes' : '❌ No'}`);
        
        successCount++;
      } else {
        console.log(`❌ FAILED for Exact NDC: "${testNDC}" - No success flag`);
      }
      
    } catch (error) {
      console.log(`❌ ERROR for Exact NDC: "${testNDC}"`);
      if (error.response?.status === 404) {
        console.log(`   🚫 404: ${error.response.data.error}`);
        console.log(`   💡 Suggestion: ${error.response.data.message}`);
      } else {
        console.log(`   🚫 Error: ${error.response?.status || error.code} - ${error.message}`);
      }
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🎉 Exact NDC Search Test Complete!');
  console.log(`📊 Success Rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  console.log('📋 Summary:');
  console.log(`   ✅ Successful exact searches: ${successCount}`);
  console.log(`   ❌ Failed searches: ${totalCount - successCount}`);
  
  if (successCount > 0) {
    console.log(`\n🎯 The exact NDC search endpoint is working!`);
    console.log(`📍 API endpoint: GET /api/drugs/labeling/search/ndc-exact?ndc={exactNDC}&limit={limit}`);
    console.log(`📍 Example: GET /api/drugs/labeling/search/ndc-exact?ndc=15631-0404-0&limit=1`);
    console.log(`🔍 Uses: openfda.package_ndc.exact and openfda.product_ndc.exact fields`);
  }
}

// Run the test
testExactNDCSearch().catch(console.error);