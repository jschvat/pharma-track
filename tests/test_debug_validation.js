require('dotenv').config();
const { verifyName } = require('./middleware/dataVerification');
const { validationResult } = require('express-validator');

// Test the exact same validation that the server uses
async function testValidation() {
  const testData = {
    name: 'Test Admin 4',
    email: 'testadmin4@example.com',
    phone: '5551234574',
    password: 'TestPassword123!',
    address: '789 Admin Street, Test City, TC 12345',
    role: 'admin'
  };

  console.log('Testing validation with data:', testData);

  // Create a mock request object like express would
  const mockReq = {
    body: testData
  };

  try {
    // Test name validation
    const nameValidator = verifyName();
    await nameValidator.run(mockReq);
    const result = validationResult(mockReq);
    
    console.log('\n=== Name Validation ===');
    console.log('Errors:', result.array());
    console.log('Is valid:', result.isEmpty());

    if (!result.isEmpty()) {
      console.log('❌ Name validation failed:');
      result.array().forEach(error => {
        console.log(`  - Field: ${error.path}, Message: ${error.msg}, Value: "${error.value}"`);
      });
    } else {
      console.log('✅ Name validation passed');
    }

    // Test the exact regex manually
    const nameRegex = /^[a-zA-Z0-9\s\-'\.]+$/;
    const nameTest = nameRegex.test(testData.name);
    console.log('\n=== Manual Regex Test ===');
    console.log(`Regex: ${nameRegex}`);
    console.log(`Name: "${testData.name}"`);
    console.log(`Test result: ${nameTest}`);

  } catch (error) {
    console.error('Validation test error:', error);
  }
}

testValidation();