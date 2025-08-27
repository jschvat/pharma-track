#!/usr/bin/env node

/**
 * Test OpenFDA Generic Name Search
 * Tests our fdaService.searchLabelingByGenericName function with common drug names
 */

const fdaService = require('./openfda/fdaService');

async function testGenericNameSearch() {
  console.log('🧪 Testing OpenFDA Generic Name Search\n');
  
  // Test common generic drug names
  const testGenericNames = [
    'acetaminophen',     // Very common pain reliever
    'ibuprofen',         // Common NSAID
    'metformin',         // Common diabetes medication
    'lisinopril',        // Common blood pressure medication
    'omeprazole',        // Common acid reducer
    'silicea',           // From our successful NDC test
    'amoxicillin',       // Common antibiotic
    'atorvastatin',      // Common cholesterol medication
  ];
  
  let successCount = 0;
  let totalCount = testGenericNames.length;
  
  for (const genericName of testGenericNames) {
    console.log(`\n🔍 Testing Generic Name: "${genericName}"`);
    console.log('=' .repeat(60));
    
    try {
      const startTime = Date.now();
      const result = await fdaService.searchLabelingByGenericName(genericName, 3);
      const responseTime = Date.now() - startTime;
      
      if (result && result.data && result.data.results && result.data.results.length > 0) {
        const labeling = result.data.results[0];
        console.log(`✅ SUCCESS for Generic Name: "${genericName}"`);
        console.log(`   ⚡ Response time: ${responseTime}ms`);
        console.log(`   📊 Results found: ${result.data.results.length}`);
        console.log(`   🏷️  Generic names found: ${labeling.openfda?.generic_name?.slice(0, 2).join(', ') || 'N/A'}`);
        console.log(`   🏷️  Brand names found: ${labeling.openfda?.brand_name?.slice(0, 2).join(', ') || 'N/A'}`);
        console.log(`   🏷️  Manufacturer: ${labeling.openfda?.manufacturer_name?.[0] || 'N/A'}`);
        console.log(`   💾 From cache: ${result.fromCache ? '✅ Yes' : '❌ No'}`);
        
        // Show some sample NDCs if available
        if (labeling.openfda?.package_ndc && labeling.openfda.package_ndc.length > 0) {
          console.log(`   📦 Sample Package NDCs: ${labeling.openfda.package_ndc.slice(0, 3).join(', ')}`);
        }
        if (labeling.openfda?.product_ndc && labeling.openfda.product_ndc.length > 0) {
          console.log(`   📦 Sample Product NDCs: ${labeling.openfda.product_ndc.slice(0, 3).join(', ')}`);
        }
        
        successCount++;
      } else {
        console.log(`❌ FAILED for Generic Name: "${genericName}" - No results found`);
      }
      
    } catch (error) {
      console.log(`❌ ERROR for Generic Name: "${genericName}"`);
      console.log(`   🚫 Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🎉 OpenFDA Generic Name Search Test Complete!');
  console.log(`📊 Success Rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  console.log('📋 Summary:');
  console.log(`   ✅ Successful searches: ${successCount}`);
  console.log(`   ❌ Failed searches: ${totalCount - successCount}`);
  
  if (successCount > 0) {
    console.log(`\n🎯 The generic name search functionality is working!`);
    console.log(`📍 API endpoint: GET /api/drugs/labeling/search/generic?name={genericName}&limit={limit}`);
    console.log(`📍 Example: GET /api/drugs/labeling/search/generic?name=acetaminophen&limit=5`);
  }
}

// Run the test
testGenericNameSearch().catch(console.error);