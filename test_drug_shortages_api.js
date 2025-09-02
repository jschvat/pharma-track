/**
 * Test script for the new Drug Shortages API endpoints
 * Tests package_ndc, generic name, brand name, and advanced search functionality
 */

const axios = require('axios');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TEST_TOKEN = process.env.TEST_TOKEN || 'your-test-token-here';

// Create axios instance with authentication
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Test data
const testData = {
  // Common NDCs that might have shortages
  packageNDCs: [
    '00054-0142-63',  // Generic drug NDC
    '00591-0405-01',  // Another common NDC
    '63739-0041-10',  // Package NDC format
  ],
  genericNames: [
    'acetaminophen',
    'ibuprofen', 
    'amoxicillin',
    'metformin',
    'lisinopril'
  ],
  brandNames: [
    'Tylenol',
    'Advil',
    'Amoxil',
    'Glucophage',
    'Prinivil'
  ]
};

async function testDrugShortagesAPI() {
  console.log('🧪 Testing Drug Shortages API Endpoints');
  console.log('=====================================\n');

  try {
    // Test 1: Service Status
    console.log('📊 Test 1: Drug Shortages Service Status');
    console.log('-----------------------------------------');
    try {
      const statusResponse = await api.get('/api/drug-shortages/status');
      console.log('✅ Status endpoint working');
      console.log('   Service status:', statusResponse.data.status);
      console.log('   Available endpoints:', Object.keys(statusResponse.data.endpoints).length);
      console.log('   Cache stats:', statusResponse.data.cache_stats);
    } catch (error) {
      console.log('❌ Status endpoint failed:', error.response?.data?.message || error.message);
    }
    console.log('');

    // Test 2: Package NDC Search
    console.log('📦 Test 2: Package NDC Search');
    console.log('-----------------------------');
    for (const ndc of testData.packageNDCs.slice(0, 2)) { // Test first 2 NDCs
      try {
        console.log(`   Testing NDC: ${ndc}`);
        const ndcResponse = await api.get(`/api/drug-shortages/package-ndc/${ndc}?limit=5`);
        console.log(`   ✅ NDC "${ndc}": Found ${ndcResponse.data.data?.length || 0} shortages`);
        console.log(`   📋 From cache: ${ndcResponse.data.fromCache}`);
        if (ndcResponse.data.data && ndcResponse.data.data.length > 0) {
          const firstShortage = ndcResponse.data.data[0];
          console.log(`   💊 Example: ${firstShortage.summary.drug_name} (${firstShortage.summary.current_status})`);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`   ℹ️  NDC "${ndc}": No shortages found (expected for many NDCs)`);
        } else {
          console.log(`   ❌ NDC "${ndc}": Error -`, error.response?.data?.message || error.message);
        }
      }
    }
    console.log('');

    // Test 3: Generic Name Search  
    console.log('🧬 Test 3: Generic Name Search');
    console.log('------------------------------');
    for (const genericName of testData.genericNames.slice(0, 3)) { // Test first 3 generics
      try {
        console.log(`   Testing generic: ${genericName}`);
        const genericResponse = await api.get(`/api/drug-shortages/generic/${genericName}?limit=3`);
        console.log(`   ✅ Generic "${genericName}": Found ${genericResponse.data.data?.length || 0} shortages`);
        console.log(`   📋 From cache: ${genericResponse.data.fromCache}`);
        if (genericResponse.data.data && genericResponse.data.data.length > 0) {
          const firstShortage = genericResponse.data.data[0];
          console.log(`   💊 Example: ${firstShortage.summary.drug_name} by ${firstShortage.summary.manufacturer}`);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`   ℹ️  Generic "${genericName}": No shortages found (expected for many drugs)`);
        } else {
          console.log(`   ❌ Generic "${genericName}": Error -`, error.response?.data?.message || error.message);
        }
      }
    }
    console.log('');

    // Test 4: Brand Name Search
    console.log('🏷️  Test 4: Brand Name Search');
    console.log('-----------------------------');
    for (const brandName of testData.brandNames.slice(0, 2)) { // Test first 2 brands
      try {
        console.log(`   Testing brand: ${brandName}`);
        const brandResponse = await api.get(`/api/drug-shortages/brand/${brandName}?limit=3`);
        console.log(`   ✅ Brand "${brandName}": Found ${brandResponse.data.data?.length || 0} shortages`);
        console.log(`   📋 From cache: ${brandResponse.data.fromCache}`);
        if (brandResponse.data.data && brandResponse.data.data.length > 0) {
          const firstShortage = brandResponse.data.data[0];
          console.log(`   💊 Example: ${firstShortage.product_info.proprietary_name} (${firstShortage.shortage_info.status})`);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`   ℹ️  Brand "${brandName}": No shortages found (expected for many drugs)`);
        } else {
          console.log(`   ❌ Brand "${brandName}": Error -`, error.response?.data?.message || error.message);
        }
      }
    }
    console.log('');

    // Test 5: Advanced Multi-Criteria Search
    console.log('🔍 Test 5: Advanced Multi-Criteria Search');
    console.log('-----------------------------------------');
    const advancedSearchCriteria = [
      {
        genericName: 'acetaminophen',
        limit: 3
      },
      {
        brandName: 'Tylenol',
        status: 'Currently in Shortage',
        limit: 2
      },
      {
        packageNDC: '00054-0142-63',
        genericName: 'acetaminophen',
        limit: 5
      }
    ];

    for (const [index, criteria] of advancedSearchCriteria.entries()) {
      try {
        console.log(`   Advanced search ${index + 1}:`, JSON.stringify(criteria, null, 2));
        const advancedResponse = await api.post('/api/drug-shortages/search', criteria);
        console.log(`   ✅ Advanced search ${index + 1}: Found ${advancedResponse.data.data?.length || 0} shortages`);
        console.log(`   📋 From cache: ${advancedResponse.data.fromCache}`);
        if (advancedResponse.data.data && advancedResponse.data.data.length > 0) {
          console.log(`   💊 Results preview:`);
          advancedResponse.data.data.slice(0, 2).forEach((shortage, idx) => {
            console.log(`     ${idx + 1}. ${shortage.summary.drug_name} - ${shortage.summary.current_status}`);
          });
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`   ℹ️  Advanced search ${index + 1}: No shortages found (expected for many criteria)`);
        } else if (error.response?.status === 400) {
          console.log(`   ⚠️  Advanced search ${index + 1}: Validation error -`, error.response?.data?.message);
        } else {
          console.log(`   ❌ Advanced search ${index + 1}: Error -`, error.response?.data?.message || error.message);
        }
      }
    }
    console.log('');

    // Test 6: Error Handling
    console.log('⚠️  Test 6: Error Handling');
    console.log('-------------------------');
    
    // Test invalid NDC
    try {
      await api.get('/api/drug-shortages/package-ndc/invalid-ndc');
      console.log('   ❌ Should have failed for invalid NDC');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('   ✅ Correctly rejected invalid NDC format');
      } else {
        console.log(`   ⚠️  Unexpected error for invalid NDC: ${error.response?.status} - ${error.response?.data?.message}`);
      }
    }

    // Test empty advanced search
    try {
      await api.post('/api/drug-shortages/search', { limit: 5 });
      console.log('   ❌ Should have failed for empty search criteria');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('   ✅ Correctly rejected empty search criteria');
      } else {
        console.log(`   ⚠️  Unexpected error for empty search: ${error.response?.status} - ${error.response?.data?.message}`);
      }
    }

    console.log('');
    console.log('🎉 Drug Shortages API Test Complete!');
    console.log('====================================');

  } catch (error) {
    console.error('💥 Test suite failed with error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Authentication test helper
async function testAuthentication() {
  console.log('🔐 Testing authentication...');
  try {
    // Try without token
    const noAuthApi = axios.create({
      baseURL: BASE_URL,
      timeout: 5000
    });
    
    await noAuthApi.get('/api/drug-shortages/status');
    console.log('❌ Should have required authentication');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Authentication properly required');
    } else {
      console.log('⚠️  Unexpected auth error:', error.response?.status);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Drug Shortages API Test Suite');
  console.log('==========================================\n');
  
  // Check if we have a valid token for testing
  if (!TEST_TOKEN || TEST_TOKEN === 'your-test-token-here') {
    console.log('⚠️  WARNING: No test token provided. Set TEST_TOKEN environment variable.');
    console.log('             Some tests may fail due to authentication.');
    console.log('');
  }

  await testAuthentication();
  console.log('');
  
  await testDrugShortagesAPI();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Test interrupted by user');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught exception:', error.message);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testDrugShortagesAPI };