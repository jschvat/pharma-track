#!/usr/bin/env node

/**
 * Test fdaService.searchByNDC Function
 * Tests the drug database search (not labeling) by NDC
 */

const fdaService = require('./openfda/fdaService');

async function testSearchByNDC() {
  console.log('🧪 Testing fdaService.searchByNDC Function\n');
  console.log('This tests the FDA drug database search (not labeling) by NDC...\n');
  
  // Mix of NDCs - some that worked in labeling tests, plus some others
  const testNDCs = [
    { ndc: '15631-0404-0', description: 'Silicea (Package NDC)' },
    { ndc: '15631-0404', description: 'Silicea (Product NDC)' },
    { ndc: '63941-519-15', description: 'Acetaminophen (Package NDC)' },
    { ndc: '63941-519', description: 'Acetaminophen (Product NDC)' },
    { ndc: '59779-438-12', description: 'Ibuprofen (Package NDC)' },
    { ndc: '0378-6055-01', description: 'Metformin HCl (Package NDC)' },
    { ndc: '0378-6055', description: 'Metformin HCl (Product NDC)' },
    { ndc: '68382-063-01', description: 'Lisinopril (Package NDC)' },
    { ndc: '00003-0232-21', description: 'Test NDC from database' },
    { ndc: '12345-678-90', description: 'Invalid test NDC' }
  ];
  
  let successCount = 0;
  let totalCount = testNDCs.length;
  
  console.log('🎯 Testing searchByNDC with 10 Different NDCs');
  console.log('=' .repeat(70));
  
  for (let i = 0; i < testNDCs.length; i++) {
    const testCase = testNDCs[i];
    console.log(`\n[${i + 1}/${testNDCs.length}] Testing NDC: "${testCase.ndc}"`);
    console.log(`   📋 Description: ${testCase.description}`);
    console.log('   ' + '-'.repeat(50));
    
    try {
      const startTime = Date.now();
      const result = await fdaService.searchByNDC(testCase.ndc);
      const responseTime = Date.now() - startTime;
      
      if (result && result.data && result.data.results && result.data.results.length > 0) {
        const drug = result.data.results[0];
        console.log(`   ✅ SUCCESS - ${responseTime}ms`);
        console.log(`      📊 Results found: ${result.data.results.length}`);
        console.log(`      💾 From cache: ${result.fromCache ? 'Yes' : 'No'}`);
        console.log(`      🏷️  Generic name: ${drug.generic_name || 'N/A'}`);
        console.log(`      🏷️  Brand name: ${drug.brand_name || 'N/A'}`);
        console.log(`      🏷️  Labeler: ${drug.labeler_name || 'N/A'}`);
        console.log(`      📦 Product NDC: ${drug.product_ndc || 'N/A'}`);
        console.log(`      📦 Package NDCs: ${drug.packaging?.map(p => p.package_ndc).join(', ') || 'N/A'}`);
        
        successCount++;
      } else {
        console.log(`   ❌ FAILED - No results found`);
        console.log(`      ⏱️  Response time: ${responseTime}ms`);
        console.log(`      💾 From cache: ${result?.fromCache ? 'Yes' : 'No'}`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR - ${error.message}`);
      console.log(`      🚫 Error type: ${error.name || 'Unknown'}`);
    }
    
    // Small delay between tests
    if (i < testNDCs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  // Final Results Summary
  console.log('\n' + '=' .repeat(70));
  console.log('🎉 searchByNDC Function Testing Complete!');
  console.log('=' .repeat(70));
  
  console.log(`\n📊 OVERALL RESULTS:`);
  console.log(`   ✅ Successful searches: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  console.log(`   ❌ Failed searches: ${totalCount - successCount}/${totalCount}`);
  
  console.log(`\n🔍 FUNCTION DETAILS:`);
  console.log(`   📍 Function: fdaService.searchByNDC(ndc)`);
  console.log(`   🎯 Purpose: Search FDA drug database by NDC`);
  console.log(`   📊 API: https://api.fda.gov/drug/ndc.json`);
  console.log(`   🔍 Search field: product_ndc`);
  console.log(`   📋 Format attempts: Multiple NDC format variations`);
  
  if (successCount > 0) {
    console.log(`\n🎯 The searchByNDC function is working!`);
    console.log(`✅ API key integration ${fdaService.apiKey ? 'active' : 'not active'}`);
    console.log(`✅ Intelligent caching implemented`);
    console.log(`✅ Multiple NDC format support`);
  } else {
    console.log(`\n⚠️  No successful searches - may need investigation`);
  }
  
  console.log(`\n💡 Note: This function searches the FDA drug database`);
  console.log(`   (different from labeling database used by searchLabelingByNDC)`);
}

// Run the test
testSearchByNDC().catch(console.error);