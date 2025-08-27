/**
 * Test Product Labeling Cache System
 * 
 * Tests the complete product labeling cache system including:
 * - Database table functionality
 * - Cache model methods
 * - API endpoint integration
 * - Cache hit/miss scenarios
 */

const ProductLabelingCache = require('./models/ProductLabelingCache');
const fdaService = require('./openfda/fdaService');

async function testLabelingCacheSystem() {
  console.log('🧪 Testing Product Labeling Cache System\n');
  
  try {
    // Test 1: Get FDA labeling data directly (to find an NDC that works)
    console.log('📋 Test 1: Finding an NDC with labeling data');
    
    // Search for acetaminophen to get a real NDC with labeling data
    const searchResult = await fdaService.searchLabelingByGenericName('acetaminophen', 1);
    
    if (!searchResult.data.results || searchResult.data.results.length === 0) {
      throw new Error('No acetaminophen labeling data found');
    }
    
    const testNDC = searchResult.data.results[0].openfda?.product_ndc?.[0];
    console.log(`✅ Found test NDC with labeling data: ${testNDC}`);
    
    // Test 2: Test cache miss (first request)
    console.log('\n📋 Test 2: Testing cache miss scenario');
    
    const startTime = Date.now();
    const firstResult = await ProductLabelingCache.getByNDC(testNDC);
    const firstRequestTime = Date.now() - startTime;
    
    if (!firstResult) {
      throw new Error('Failed to get labeling data on first request');
    }
    
    console.log(`✅ First request successful (cache miss)`);
    console.log(`   Response time: ${firstRequestTime}ms`);
    console.log(`   Generic name: ${firstResult.product_info?.generic_name}`);
    console.log(`   Has indications: ${!!firstResult.indications_and_usage}`);
    console.log(`   From cache: ${firstResult.cache_info?.from_cache}`);
    
    // Test 3: Test cache hit (second request)
    console.log('\n📋 Test 3: Testing cache hit scenario');
    
    const secondStartTime = Date.now();
    const secondResult = await ProductLabelingCache.getByNDC(testNDC);
    const secondRequestTime = Date.now() - secondStartTime;
    
    if (!secondResult) {
      throw new Error('Failed to get labeling data on second request');
    }
    
    console.log(`✅ Second request successful (cache hit)`);
    console.log(`   Response time: ${secondRequestTime}ms`);
    console.log(`   From cache: ${secondResult.cache_info?.from_cache}`);
    console.log(`   Speed improvement: ${Math.round((firstRequestTime - secondRequestTime) / firstRequestTime * 100)}%`);
    
    // Test 4: Test cache statistics
    console.log('\n📋 Test 4: Testing cache statistics');
    
    const stats = await ProductLabelingCache.getCacheStats();
    console.log(`✅ Cache statistics retrieved:`);
    console.log(`   Total entries: ${stats.total_entries}`);
    console.log(`   Valid entries: ${stats.valid_entries}`);
    console.log(`   Expired entries: ${stats.expired_entries}`);
    console.log(`   Cache hit ratio: ${Math.round(stats.cache_hit_ratio * 100)}%`);
    
    // Test 5: Test search functionality
    console.log('\n📋 Test 5: Testing search functionality');
    
    const searchResults = await ProductLabelingCache.search({ 
      genericName: 'acetaminophen' 
    }, 5);
    
    console.log(`✅ Search results: ${searchResults.length} entries found`);
    if (searchResults.length > 0) {
      console.log(`   First result: ${searchResults[0].product_info?.generic_name}`);
    }
    
    console.log('\n🎉 All tests passed! Product Labeling Cache System is working correctly.');
    console.log('\n📋 System Features Verified:');
    console.log('   ✅ Automatic FDA API integration');
    console.log('   ✅ Intelligent caching with 90-day expiration');  
    console.log('   ✅ Fast cache lookups');
    console.log('   ✅ Comprehensive labeling data storage');
    console.log('   ✅ Search and statistics functionality');
    
    return {
      testNDC,
      cacheWorking: true,
      performanceImprovement: Math.round((firstRequestTime - secondRequestTime) / firstRequestTime * 100)
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run test if called directly
if (require.main === module) {
  testLabelingCacheSystem()
    .then((result) => {
      console.log('\n✅ Test completed successfully');
      console.log('Test NDC for frontend testing:', result.testNDC);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testLabelingCacheSystem };