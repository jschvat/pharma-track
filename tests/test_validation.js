require('dotenv').config();
const { verifyName } = require('./middleware/dataVerification');

// Create a mock request object
const mockReq = {
  body: {
    name: 'Test Admin 3'
  }
};

const mockRes = {};
const mockNext = () => console.log('Next called');

console.log('Testing name validation with "Test Admin 3"');

// Get the validation middleware
const nameValidator = verifyName();

// Test the validation
nameValidator.run(mockReq).then((result) => {
  console.log('Validation result:', result);
  console.log('Errors:', result.array());
  
  if (result.array().length > 0) {
    console.log('❌ Validation failed');
    result.array().forEach(error => {
      console.log(`- ${error.msg}`);
    });
  } else {
    console.log('✅ Validation passed');
  }
}).catch(err => {
  console.error('Validation error:', err);
});