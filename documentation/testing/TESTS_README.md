# PharmaTraK Testing Suite

This directory contains comprehensive tests for the PharmaTraK pharmacy management system, including OpenFDA service integration, API endpoints, validation, and user management functionality.

## Test Files

### FDA Service Tests
#### `fdaService.test.js` - Unit Tests
Comprehensive Jest unit tests covering:
- **NDC Validation & Formatting**: Format validation, cleaning, and standardization
- **API Search Methods**: All search endpoints (NDC, generic name, brand name, manufacturer, advanced)
- **Cache Functionality**: Cache hits/misses, statistics, and clearing
- **Error Handling**: Network errors, API errors, invalid inputs
- **Edge Cases**: Empty responses, malformed data, special characters

#### `manual-fda-test.js` - Integration Tests

### API & Backend Tests
#### `test-api.js` - API Endpoint Tests
Comprehensive testing of REST API endpoints and functionality.

#### `test_audit_api.js` - Audit API Tests  
Specific tests for audit functionality and inventory tracking.

#### `test_audit_error.js` - Audit Error Handling
Tests for audit error scenarios and validation.

#### `test_user_creation.js` - User Management Tests
Tests for user creation, validation, and CRUD operations.

#### `test_validation.js` - Input Validation Tests
Tests for data validation middleware and constraints.

### Frontend Tests  
#### `test_debug_validation.js` - Frontend Validation Tests
Tests for frontend form validation and user input handling.

#### `test_frontend_audit.js` - Frontend Audit Tests
Tests for frontend audit interface and functionality.

### Middleware Tests
#### `test_middleware_patterns.js` - Middleware Pattern Tests
Tests for authentication, validation, and error handling middleware.

### Configuration Files
#### `manual-fda-test.js` - Integration Tests
Interactive testing script for real FDA API integration:
- **Real API Testing**: Makes actual calls to OpenFDA API
- **Performance Testing**: Response time measurement and cache performance
- **Interactive Mode**: Manual testing with user input
- **Offline Mode**: Tests that don't require API access

### `jest.config.js` - Jest Configuration
- Test environment setup
- Coverage configuration
- Module paths and transformations
- Timeout settings

### `setupTests.js` - Test Setup
- Global test configuration
- Mock setup and teardown
- Helper functions and utilities
- Custom Jest matchers

## Running Tests

### Unit Tests (Jest)

```bash
# Run all Jest tests
npm test
make test

# Run tests in watch mode
npm run test:watch
make test-watch

# Run tests with coverage report
npm run test:coverage
make test-coverage
```

### Integration Tests (Manual)

```bash
# Run all FDA integration tests
npm run test:fda
make test-fda

# Interactive testing mode
npm run test:fda:interactive
make test-fda-interactive

# Offline tests only (no API calls)
npm run test:fda:offline
make test-fda-offline
```

## Test Scenarios

### NDC Validation Tests
- ✅ Format validation (10-11 digits)
- ✅ Cleaning (remove dashes, spaces, dots)
- ✅ Formatting (add standard dashes)
- ✅ Error handling for invalid formats

### FDA API Integration Tests
- ✅ Search by NDC (valid and invalid)
- ✅ Search by generic name
- ✅ Search by brand name
- ✅ Search by manufacturer
- ✅ Advanced multi-criteria search
- ✅ Response parsing and validation

### Cache Tests
- ✅ Cache miss and hit scenarios
- ✅ Cache statistics tracking
- ✅ Cache clearing functionality
- ✅ Performance improvement verification

### Error Handling Tests
- ✅ Network connectivity issues
- ✅ FDA API rate limiting (429)
- ✅ Not found errors (404)
- ✅ Server errors (500+)
- ✅ Timeout handling
- ✅ Invalid input validation

### Performance Tests
- ✅ Response time measurement
- ✅ Cache performance comparison
- ✅ Load testing capabilities

## Interactive Testing

The manual test script provides an interactive mode for testing:

```bash
npm run test:fda:interactive
```

**Interactive Options:**
1. **Search by NDC** - Enter NDC to search
2. **Search by Generic Name** - Enter drug generic name
3. **Search by Brand Name** - Enter brand/trade name
4. **Search by Manufacturer** - Enter manufacturer name
5. **Advanced Search** - Combine multiple criteria
6. **Show Cache Stats** - View cache performance
7. **Clear Cache** - Reset cache for testing

## Sample Test Data

### Valid NDCs for Testing
- `0069-2587-10` - Tylenol (Acetaminophen)
- `0591-0405-01` - Advil (Ibuprofen)
- `0074-3778-13` - Motrin (Ibuprofen)

### Generic Names
- `acetaminophen`
- `ibuprofen`
- `aspirin`

### Brand Names
- `tylenol`
- `advil`
- `motrin`

### Manufacturers
- `McNeil`
- `Pfizer`
- `Johnson & Johnson`

## Test Output

### Unit Test Output
```
PASS tests/fdaService.test.js
✓ NDC Validation and Formatting
  ✓ should clean NDC correctly
  ✓ should validate NDC format
  ✓ should format NDC with dashes
✓ FDA API Search Methods
  ✓ should search by NDC
  ✓ should search by generic name
  ...
```

### Integration Test Output
```
=== OpenFDA Service Test Suite ===

🧪 Testing: NDC Cleaning
✅ PASSED: NDC Cleaning

🧪 Testing: Search by Valid NDC
ℹ️  ✓ Found 1 results for NDC 0069-2587-10
ℹ️  ✓ From cache: false
✅ PASSED: Search by Valid NDC

=== Test Results Summary ===
Total Tests: 15
✅ Passed: 15
🎉 All tests passed! (100.0%)
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- **HTML Report**: `coverage/lcov-report/index.html`
- **Text Report**: Console output
- **LCOV Report**: `coverage/lcov.info`

## Troubleshooting

### Common Issues

1. **Network Errors**
   - Check internet connection
   - Verify FDA API is accessible
   - Use offline mode for testing: `npm run test:fda:offline`

2. **Rate Limiting**
   - FDA API has rate limits (240 requests/minute)
   - Tests include delays to avoid rate limiting
   - Use cache to reduce API calls

3. **Test Timeouts**
   - FDA API can be slow (5-10 seconds)
   - Tests have 30-second timeout
   - Adjust timeout in `jest.config.js` if needed

4. **Mock Issues**
   - Ensure axios is properly mocked in unit tests
   - Check mock responses match expected format
   - Clear mocks between tests

### Environment Variables

Set these for testing:
```env
NODE_ENV=test
FDA_API_TIMEOUT=10000
```

## Adding New Tests

### Unit Tests
Add to `fdaService.test.js`:
```javascript
test('should handle new scenario', async () => {
  // Arrange
  const mockResponse = { data: { results: [] } };
  axios.get.mockResolvedValue(mockResponse);

  // Act
  const result = await fdaService.searchByNDC('test-ndc');

  // Assert
  expect(result.data.results).toHaveLength(0);
});
```

### Integration Tests
Add to `manual-fda-test.js`:
```javascript
await runTest('New Integration Test', async () => {
  const result = await fdaService.someNewMethod();
  if (!result.data) {
    throw new Error('Expected data in response');
  }
  info('✓ New test passed');
});
```

## Best Practices

1. **Mock External APIs** in unit tests
2. **Test Error Conditions** thoroughly
3. **Use Real Data** in integration tests
4. **Verify Cache Behavior** in performance tests
5. **Test Edge Cases** like empty responses
6. **Clean Up** after tests (clear cache, reset mocks)
7. **Use Descriptive Test Names** for clarity
8. **Group Related Tests** in describe blocks