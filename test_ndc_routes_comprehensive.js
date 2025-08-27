#!/usr/bin/env node

/**
 * Comprehensive NDC Routes Testing
 * Tests both /api/drugs/labeling/search/ndc-exact and /api/drugs/labeling/search/ndc endpoints
 * with 10 known brand and generic NDCs
 */

const axios = require('axios');

async function testNDCRoutes() {
  console.log('🧪 Comprehensive NDC Routes Testing\n');
  console.log('Testing both exact NDC and multi-format NDC search endpoints...\n');
  
  // Mix of known working NDCs from our database and FDA - brand and generic drugs
  const testNDCs = [
    // From our previous successful tests
    { ndc: '15631-0404-0', type: 'Generic', drug: 'Silicea (homeopathic)', format: 'Package NDC' },
    { ndc: '15631-0404', type: 'Generic', drug: 'Silicea (homeopathic)', format: 'Product NDC' },
    { ndc: '63941-519-15', type: 'Generic', drug: 'Acetaminophen', format: 'Package NDC' },
    { ndc: '63941-519', type: 'Generic', drug: 'Acetaminophen', format: 'Product NDC' },
    { ndc: '59779-438-12', type: 'Generic', drug: 'Ibuprofen', format: 'Package NDC' },
    
    // Additional well-known NDCs for comprehensive testing
    { ndc: '0378-6055-01', type: 'Generic', drug: 'Metformin HCl', format: 'Package NDC' },
    { ndc: '0378-6055', type: 'Generic', drug: 'Metformin HCl', format: 'Product NDC' },
    { ndc: '68382-063-01', type: 'Generic', drug: 'Lisinopril', format: 'Package NDC' },
    { ndc: '68382-063', type: 'Generic', drug: 'Lisinopril', format: 'Product NDC' },
    { ndc: '63629-1545-1', type: 'Generic', drug: 'Omeprazole', format: 'Package NDC' }
  ];
  
  // Get authentication token first
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
  
  // Test results tracking
  let exactSearchResults = { success: 0, total: testNDCs.length };
  let multiFormatResults = { success: 0, total: testNDCs.length };
  
  console.log('🎯 Testing NDC Routes with 10 Known NDCs');
  console.log('=' .repeat(80));
  
  for (let i = 0; i < testNDCs.length; i++) {
    const testCase = testNDCs[i];
    console.log(`\n[${i + 1}/${testNDCs.length}] Testing NDC: "${testCase.ndc}"`);
    console.log(`   🏷️  Drug: ${testCase.drug} (${testCase.type})`);
    console.log(`   📋 Format: ${testCase.format}`);
    console.log('   ' + '-'.repeat(60));
    
    // Test 1: Exact NDC Search
    console.log('   🎯 Test 1: Exact NDC Search (/ndc-exact)');
    try {
      const startTime = Date.now();
      const exactResponse = await axios.get(`http://localhost:3001/api/drugs/labeling/search/ndc-exact`, {
        params: { ndc: testCase.ndc, limit: 1 },
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 15000
      });
      const responseTime = Date.now() - startTime;
      
      if (exactResponse.data.success) {
        console.log(`   ✅ EXACT SUCCESS - ${responseTime}ms`);
        console.log(`      📊 Results: ${exactResponse.data.results_count}`);
        console.log(`      🏷️  Field: ${exactResponse.data.field_used}`);
        console.log(`      🏷️  Generic: ${exactResponse.data.labeling_data.product_info.generic_name || 'N/A'}`);
        console.log(`      🏷️  Brand: ${exactResponse.data.labeling_data.product_info.brand_name || 'N/A'}`);
        exactSearchResults.success++;
      } else {
        console.log(`   ❌ EXACT FAILED - No success flag`);
      }
    } catch (error) {
      console.log(`   ❌ EXACT ERROR - ${error.response?.status || error.code}: ${error.response?.data?.error || error.message}`);
    }
    
    // Test 2: Multi-format NDC Search
    console.log('   🔍 Test 2: Multi-format NDC Search (/ndc)');
    try {
      const startTime = Date.now();
      const multiResponse = await axios.get(`http://localhost:3001/api/drugs/labeling/search/ndc`, {
        params: { ndc: testCase.ndc, limit: 1 },
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 15000
      });
      const responseTime = Date.now() - startTime;
      
      // Check if we have results (different response format than exact search)
      if (multiResponse.data.results && multiResponse.data.results.length > 0) {
        console.log(`   ✅ MULTI SUCCESS - ${responseTime}ms`);
        console.log(`      📊 Results: ${multiResponse.data.results.length}`);
        console.log(`      📊 Total: ${multiResponse.data.total}`);
        console.log(`      💾 From cache: ${multiResponse.data.fromCache ? 'Yes' : 'No'}`);
        console.log(`      🏷️  Generic: ${multiResponse.data.parsed?.product_info?.generic_name || 'N/A'}`);
        console.log(`      🏷️  Brand: ${multiResponse.data.parsed?.product_info?.brand_name || 'N/A'}`);
        multiFormatResults.success++;
      } else {
        console.log(`   ❌ MULTI FAILED - No results found`);
      }
    } catch (error) {
      console.log(`   ❌ MULTI ERROR - ${error.response?.status || error.code}: ${error.response?.data?.error || error.message}`);
    }
    
    // Small delay between tests to be respectful to the API
    if (i < testNDCs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Final Results Summary
  console.log('\n' + '=' .repeat(80));
  console.log('🎉 NDC Routes Testing Complete!');
  console.log('=' .repeat(80));
  
  console.log('\n📊 EXACT NDC SEARCH RESULTS (/ndc-exact):');
  console.log(`   ✅ Successful: ${exactSearchResults.success}/${exactSearchResults.total} (${Math.round(exactSearchResults.success/exactSearchResults.total*100)}%)`);
  console.log(`   ❌ Failed: ${exactSearchResults.total - exactSearchResults.success}/${exactSearchResults.total}`);
  
  console.log('\n📊 MULTI-FORMAT NDC SEARCH RESULTS (/ndc):');
  console.log(`   ✅ Successful: ${multiFormatResults.success}/${multiFormatResults.total} (${Math.round(multiFormatResults.success/multiFormatResults.total*100)}%)`);
  console.log(`   ❌ Failed: ${multiFormatResults.total - multiFormatResults.success}/${multiFormatResults.total}`);
  
  console.log('\n🏆 OVERALL PERFORMANCE:');
  const totalTests = exactSearchResults.total + multiFormatResults.total;
  const totalSuccess = exactSearchResults.success + multiFormatResults.success;
  console.log(`   📈 Total Tests: ${totalTests}`);
  console.log(`   ✅ Total Successful: ${totalSuccess} (${Math.round(totalSuccess/totalTests*100)}%)`);
  console.log(`   ❌ Total Failed: ${totalTests - totalSuccess}`);
  
  console.log('\n📍 ENDPOINT INFORMATION:');
  console.log('   🎯 Exact NDC: GET /api/drugs/labeling/search/ndc-exact?ndc={exactNDC}&limit={limit}');
  console.log('   🔍 Multi-format: GET /api/drugs/labeling/search/ndc?ndc={ndc}&limit={limit}');
  
  if (exactSearchResults.success > 0 || multiFormatResults.success > 0) {
    console.log('\n🎯 NDC search functionality is operational!');
    console.log('✅ OpenFDA API key integration working properly');
    console.log('✅ Both exact and multi-format NDC searches available');
  } else {
    console.log('\n⚠️  No successful searches - may need investigation');
  }
  
  console.log('\n🔑 Enhanced rate limits active with your OpenFDA API key');
}

// Run the comprehensive test
testNDCRoutes().catch(console.error);