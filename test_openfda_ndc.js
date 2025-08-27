#!/usr/bin/env node

/**
 * Test OpenFDA NDC Search with Enhanced Format Support
 * Tests our fdaService.searchLabelingByNDC function with known working NDCs
 */

const fdaService = require('./openfda/fdaService');

async function testNDCSearch() {
  
  console.log('🧪 Testing OpenFDA NDC Search with Enhanced Format Support\n');
  
  // Test NDCs - mix of known working FDA NDCs and our database NDCs
  const testNDCs = [
    '15631-0404-0',  // Known working FDA NDC (from live FDA API)
    '15631-0404',    // Same NDC without package suffix
    '156310404',     // Same NDC digits only
    '00003-0232-21', // From our database (was failing before)
    '0003-0232-21',  // Same without leading zero
    '50090-3616',    // Another common FDA NDC format
  ];
  
  for (const testNDC of testNDCs) {
    console.log(`\n🔍 Testing NDC: "${testNDC}"`);
    console.log('=' .repeat(50));
    
    try {
      const startTime = Date.now();
      const result = await fdaService.searchLabelingByNDC(testNDC, 1);
      const responseTime = Date.now() - startTime;
      
      if (result && result.data && result.data.results && result.data.results.length > 0) {
        const labeling = result.data.results[0];
        console.log(`✅ SUCCESS for NDC: "${testNDC}"`);
        console.log(`   ⚡ Response time: ${responseTime}ms`);
        console.log(`   📊 Results found: ${result.data.results.length}`);
        console.log(`   🏷️  Generic name: ${labeling.openfda?.generic_name?.[0] || 'N/A'}`);
        console.log(`   🏷️  Brand name: ${labeling.openfda?.brand_name?.[0] || 'N/A'}`);
        console.log(`   🏷️  Manufacturer: ${labeling.openfda?.manufacturer_name?.[0] || 'N/A'}`);
        console.log(`   📦 FDA Package NDCs: ${labeling.openfda?.package_ndc?.slice(0, 3).join(', ') || 'N/A'}`);
        console.log(`   📦 FDA Product NDCs: ${labeling.openfda?.product_ndc?.slice(0, 3).join(', ') || 'N/A'}`);
      } else {
        console.log(`❌ FAILED for NDC: "${testNDC}" - No results found`);
      }
      
    } catch (error) {
      console.log(`❌ ERROR for NDC: "${testNDC}"`);
      console.log(`   🚫 Error: ${error.message}`);
    }
  }
  
  console.log('\n🎉 OpenFDA NDC Search Test Complete!');
}

// Run the test
testNDCSearch().catch(console.error);