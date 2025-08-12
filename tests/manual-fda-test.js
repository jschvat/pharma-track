#!/usr/bin/env node

/**
 * Manual OpenFDA Service Test Script
 * 
 * This script performs real API calls to test the OpenFDA service functionality.
 * Use this for integration testing and to verify the service works with the actual FDA API.
 * 
 * Usage: node tests/manual-fda-test.js
 */

const fdaService = require('../openfda/fdaService');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function section(title) {
  log(`\n${colors.bold}${colors.cyan}=== ${title} ===${colors.reset}`);
}

// Test data
const testCases = {
  validNDCs: [
    '0069-2587-10',  // Tylenol
    '0591-0405-01',  // Advil
    '0074-3778-13'   // Motrin
  ],
  invalidNDCs: [
    '0000-0000-00',
    '9999-9999-99',
    'invalid-ndc'
  ],
  genericNames: [
    'acetaminophen',
    'ibuprofen',
    'aspirin'
  ],
  brandNames: [
    'tylenol',
    'advil',
    'motrin'
  ],
  manufacturers: [
    'McNeil',
    'Pfizer',
    'Johnson & Johnson'
  ]
};

// Test statistics
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

async function runTest(testName, testFunction) {
  stats.total++;
  try {
    log(`\n🧪 Testing: ${testName}`);
    await testFunction();
    stats.passed++;
    success(`PASSED: ${testName}`);
  } catch (err) {
    stats.failed++;
    error(`FAILED: ${testName}`);
    error(`Error: ${err.message}`);
  }
}

// NDC Validation Tests
async function testNDCValidation() {
  section('NDC Validation and Formatting Tests');

  await runTest('NDC Cleaning', async () => {
    const testCases = [
      { input: '12345-678-90', expected: '1234567890' },
      { input: '12345 678 90', expected: '1234567890' },
      { input: '12345.678.90', expected: '1234567890' },
      { input: '1234567890', expected: '1234567890' }
    ];

    for (const testCase of testCases) {
      const result = fdaService.cleanNDC(testCase.input);
      if (result !== testCase.expected) {
        throw new Error(`Expected ${testCase.expected}, got ${result}`);
      }
      info(`✓ ${testCase.input} → ${result}`);
    }
  });

  await runTest('NDC Validation', async () => {
    const validNDCs = ['12345-678-90', '1234567890', '12345678901'];
    const invalidNDCs = ['123456789', '123456789012', 'abc123', ''];

    for (const ndc of validNDCs) {
      if (!fdaService.validateNDC(ndc)) {
        throw new Error(`Expected ${ndc} to be valid`);
      }
      info(`✓ ${ndc} is valid`);
    }

    for (const ndc of invalidNDCs) {
      if (fdaService.validateNDC(ndc)) {
        throw new Error(`Expected ${ndc} to be invalid`);
      }
      info(`✓ ${ndc} is invalid (correctly)`);
    }
  });

  await runTest('NDC Formatting', async () => {
    const testCases = [
      { input: '1234567890', expected: '12345-678-90' },
      { input: '12345678901', expected: '12345-6789-01' }
    ];

    for (const testCase of testCases) {
      const result = fdaService.formatNDC(testCase.input);
      if (result !== testCase.expected) {
        throw new Error(`Expected ${testCase.expected}, got ${result}`);
      }
      info(`✓ ${testCase.input} → ${result}`);
    }
  });
}

// FDA API Tests
async function testFDAAPIIntegration() {
  section('FDA API Integration Tests');

  await runTest('Search by Valid NDC', async () => {
    const ndc = testCases.validNDCs[0];
    const result = await fdaService.searchByNDC(ndc);
    
    if (!result.data || !result.data.results) {
      throw new Error('Invalid response structure');
    }

    info(`✓ Found ${result.data.results.length} results for NDC ${ndc}`);
    info(`✓ From cache: ${result.fromCache}`);
    
    if (result.data.results.length > 0) {
      const drug = result.data.results[0];
      info(`✓ Generic name: ${drug.generic_name?.[0] || 'N/A'}`);
      info(`✓ Brand name: ${drug.brand_name?.[0] || 'N/A'}`);
    }
  });

  await runTest('Search by Generic Name', async () => {
    const genericName = testCases.genericNames[0];
    const result = await fdaService.searchByGenericName(genericName, 5);
    
    if (!result.data || !result.data.results) {
      throw new Error('Invalid response structure');
    }

    info(`✓ Found ${result.data.results.length} results for generic name "${genericName}"`);
    info(`✓ From cache: ${result.fromCache}`);
  });

  await runTest('Search by Brand Name', async () => {
    const brandName = testCases.brandNames[0];
    const result = await fdaService.searchByBrandName(brandName, 3);
    
    if (!result.data || !result.data.results) {
      throw new Error('Invalid response structure');
    }

    info(`✓ Found ${result.data.results.length} results for brand name "${brandName}"`);
    info(`✓ From cache: ${result.fromCache}`);
  });

  await runTest('Search by Manufacturer', async () => {
    const manufacturer = testCases.manufacturers[0];
    const result = await fdaService.searchByManufacturer(manufacturer, 3);
    
    if (!result.data || !result.data.results) {
      throw new Error('Invalid response structure');
    }

    info(`✓ Found ${result.data.results.length} results for manufacturer "${manufacturer}"`);
    info(`✓ From cache: ${result.fromCache}`);
  });

  await runTest('Advanced Search', async () => {
    const criteria = {
      genericName: testCases.genericNames[0],
      manufacturer: testCases.manufacturers[0]
    };
    
    const result = await fdaService.advancedSearch(criteria, 2);
    
    if (!result.data || !result.data.results) {
      throw new Error('Invalid response structure');
    }

    info(`✓ Found ${result.data.results.length} results for advanced search`);
    info(`✓ Criteria: ${JSON.stringify(criteria)}`);
    info(`✓ From cache: ${result.fromCache}`);
  });
}

// Cache Tests
async function testCacheFunction() {
  section('Cache Functionality Tests');

  // Clear cache first
  fdaService.clearCache();

  await runTest('Cache Miss and Hit', async () => {
    const ndc = testCases.validNDCs[1];
    
    // First call - should be cache miss
    const result1 = await fdaService.searchByNDC(ndc);
    if (result1.fromCache) {
      throw new Error('First call should not be from cache');
    }
    info('✓ First call: cache miss');

    // Second call - should be cache hit
    const result2 = await fdaService.searchByNDC(ndc);
    if (!result2.fromCache) {
      throw new Error('Second call should be from cache');
    }
    info('✓ Second call: cache hit');
  });

  await runTest('Cache Statistics', async () => {
    const stats = fdaService.getCacheStats();
    
    if (typeof stats.keys !== 'number' || stats.keys < 0) {
      throw new Error('Invalid cache statistics');
    }

    info(`✓ Cache keys: ${stats.keys}`);
    info(`✓ Cache hits: ${stats.hits}`);
    info(`✓ Cache misses: ${stats.misses}`);
  });

  await runTest('Cache Clear', async () => {
    fdaService.clearCache();
    const stats = fdaService.getCacheStats();
    
    if (stats.keys !== 0) {
      throw new Error('Cache should be empty after clear');
    }

    info('✓ Cache cleared successfully');
  });
}

// Error Handling Tests
async function testErrorHandling() {
  section('Error Handling Tests');

  await runTest('Invalid NDC Format', async () => {
    try {
      fdaService.cleanNDC('123');
      throw new Error('Should have thrown an error for invalid NDC');
    } catch (err) {
      if (!err.message.includes('NDC must be 10 or 11 digits')) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
      info('✓ Correctly threw error for invalid NDC format');
    }
  });

  await runTest('Search for Non-existent Drug', async () => {
    try {
      const result = await fdaService.searchByNDC('0000-0000-00');
      if (result.data.results && result.data.results.length > 0) {
        warning('Found results for non-existent NDC (this might be valid)');
      } else {
        info('✓ No results found for non-existent NDC');
      }
    } catch (err) {
      if (err.message.includes('No drugs found')) {
        info('✓ Correctly handled non-existent drug search');
      } else {
        throw err;
      }
    }
  });

  await runTest('Empty Advanced Search Criteria', async () => {
    try {
      await fdaService.advancedSearch({});
      throw new Error('Should have thrown an error for empty criteria');
    } catch (err) {
      if (!err.message.includes('At least one search criterion is required')) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
      info('✓ Correctly threw error for empty search criteria');
    }
  });
}

// Performance Tests
async function testPerformance() {
  section('Performance Tests');

  await runTest('Response Time Measurement', async () => {
    const startTime = Date.now();
    await fdaService.searchByGenericName('aspirin', 1);
    const responseTime = Date.now() - startTime;

    info(`✓ Response time: ${responseTime}ms`);

    if (responseTime > 10000) {
      warning('Response time is quite high (>10s)');
    } else if (responseTime > 5000) {
      warning('Response time is high (>5s)');
    } else {
      info('✓ Response time is acceptable');
    }
  });

  await runTest('Cache Performance', async () => {
    const ndc = testCases.validNDCs[2];
    
    // First call (cache miss)
    const start1 = Date.now();
    await fdaService.searchByNDC(ndc);
    const time1 = Date.now() - start1;

    // Second call (cache hit)
    const start2 = Date.now();
    await fdaService.searchByNDC(ndc);
    const time2 = Date.now() - start2;

    info(`✓ Cache miss time: ${time1}ms`);
    info(`✓ Cache hit time: ${time2}ms`);

    if (time2 < time1) {
      info('✓ Cache provides performance improvement');
    } else {
      warning('Cache might not be providing expected performance benefit');
    }
  });
}

// Print detailed results
function printDetailedResults(results) {
  if (results && results.data && results.data.results && results.data.results.length > 0) {
    const drug = results.data.results[0];
    
    console.log('\n📋 Drug Details:');
    console.log(`   NDC: ${drug.product_ndc || 'N/A'}`);
    console.log(`   Generic Name: ${drug.generic_name?.[0] || 'N/A'}`);
    console.log(`   Brand Name: ${drug.brand_name?.[0] || 'N/A'}`);
    console.log(`   Dosage Form: ${drug.dosage_form?.[0] || 'N/A'}`);
    console.log(`   Route: ${drug.route?.[0] || 'N/A'}`);
    console.log(`   Manufacturer: ${drug.openfda?.manufacturer_name?.[0] || 'N/A'}`);
    console.log(`   Product Type: ${drug.product_type || 'N/A'}`);
    console.log(`   Marketing Status: ${drug.marketing_status || 'N/A'}`);
    
    if (drug.active_ingredients && drug.active_ingredients.length > 0) {
      console.log('   Active Ingredients:');
      drug.active_ingredients.forEach((ingredient, index) => {
        console.log(`     ${index + 1}. ${ingredient.name}: ${ingredient.strength}`);
      });
    }
  }
}

// Interactive test runner
async function runInteractiveTest() {
  section('Interactive FDA API Test');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise(resolve => readline.question(prompt, resolve));

  try {
    while (true) {
      console.log('\n🔍 What would you like to search for?');
      console.log('1. Search by NDC');
      console.log('2. Search by Generic Name');
      console.log('3. Search by Brand Name');
      console.log('4. Search by Manufacturer');
      console.log('5. Advanced Search');
      console.log('6. Show Cache Stats');
      console.log('7. Clear Cache');
      console.log('0. Exit');

      const choice = await question('\nEnter your choice (0-7): ');

      switch (choice) {
        case '1':
          const ndc = await question('Enter NDC (e.g., 0069-2587-10): ');
          try {
            const result = await fdaService.searchByNDC(ndc);
            success(`Found ${result.data.results?.length || 0} results`);
            printDetailedResults(result);
          } catch (err) {
            error(`Search failed: ${err.message}`);
          }
          break;

        case '2':
          const generic = await question('Enter generic name (e.g., acetaminophen): ');
          try {
            const result = await fdaService.searchByGenericName(generic, 5);
            success(`Found ${result.data.results?.length || 0} results`);
            printDetailedResults(result);
          } catch (err) {
            error(`Search failed: ${err.message}`);
          }
          break;

        case '3':
          const brand = await question('Enter brand name (e.g., tylenol): ');
          try {
            const result = await fdaService.searchByBrandName(brand, 5);
            success(`Found ${result.data.results?.length || 0} results`);
            printDetailedResults(result);
          } catch (err) {
            error(`Search failed: ${err.message}`);
          }
          break;

        case '4':
          const manufacturer = await question('Enter manufacturer (e.g., McNeil): ');
          try {
            const result = await fdaService.searchByManufacturer(manufacturer, 5);
            success(`Found ${result.data.results?.length || 0} results`);
            printDetailedResults(result);
          } catch (err) {
            error(`Search failed: ${err.message}`);
          }
          break;

        case '5':
          console.log('Enter search criteria (press Enter to skip):');
          const advNdc = await question('  NDC: ');
          const advGeneric = await question('  Generic Name: ');
          const advBrand = await question('  Brand Name: ');
          const advMfg = await question('  Manufacturer: ');
          
          const criteria = {};
          if (advNdc) criteria.ndc = advNdc;
          if (advGeneric) criteria.genericName = advGeneric;
          if (advBrand) criteria.brandName = advBrand;
          if (advMfg) criteria.manufacturer = advMfg;

          try {
            const result = await fdaService.advancedSearch(criteria, 5);
            success(`Found ${result.data.results?.length || 0} results`);
            printDetailedResults(result);
          } catch (err) {
            error(`Search failed: ${err.message}`);
          }
          break;

        case '6':
          const cacheStats = fdaService.getCacheStats();
          info(`Cache Statistics:`);
          info(`  Keys: ${cacheStats.keys}`);
          info(`  Hits: ${cacheStats.hits}`);
          info(`  Misses: ${cacheStats.misses}`);
          break;

        case '7':
          fdaService.clearCache();
          success('Cache cleared');
          break;

        case '0':
          info('Goodbye!');
          readline.close();
          return;

        default:
          warning('Invalid choice. Please try again.');
      }
    }
  } catch (err) {
    error(`Interactive test error: ${err.message}`);
  } finally {
    readline.close();
  }
}

// Main test runner
async function main() {
  log(`${colors.bold}${colors.cyan}
╔══════════════════════════════════════════╗
║         OpenFDA Service Test Suite       ║
║                                          ║
║  Testing real FDA API integration        ║
║  and service functionality               ║
╚══════════════════════════════════════════╝
${colors.reset}`);

  const args = process.argv.slice(2);
  
  if (args.includes('--interactive') || args.includes('-i')) {
    await runInteractiveTest();
    return;
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node tests/manual-fda-test.js [options]

Options:
  --interactive, -i    Run interactive test mode
  --skip-api          Skip API tests (offline mode)
  --help, -h          Show this help message

Examples:
  node tests/manual-fda-test.js                 # Run all tests
  node tests/manual-fda-test.js --interactive   # Interactive mode
  node tests/manual-fda-test.js --skip-api      # Skip API calls
`);
    return;
  }

  const skipAPI = args.includes('--skip-api');

  try {
    // Always run NDC validation tests (offline)
    await testNDCValidation();

    if (!skipAPI) {
      info('\n🌐 Running online tests (this may take a few minutes)...');
      await testFDAAPIIntegration();
      await testCacheFunction();
      await testErrorHandling();
      await testPerformance();
    } else {
      warning('\n⚠️  Skipping API tests (offline mode)');
    }

    // Print final statistics
    section('Test Results Summary');
    log(`Total Tests: ${stats.total}`, colors.bold);
    success(`Passed: ${stats.passed}`);
    if (stats.failed > 0) {
      error(`Failed: ${stats.failed}`);
    }
    if (stats.skipped > 0) {
      warning(`Skipped: ${stats.skipped}`);
    }

    const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
    if (stats.failed === 0) {
      success(`\n🎉 All tests passed! (${passRate}%)`);
    } else {
      error(`\n❌ Some tests failed. Pass rate: ${passRate}%`);
      process.exit(1);
    }

  } catch (err) {
    error(`\n💥 Test suite failed with error: ${err.message}`);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  main();
}

module.exports = {
  runTest,
  testNDCValidation,
  testFDAAPIIntegration,
  testCacheFunction,
  testErrorHandling,
  testPerformance
};