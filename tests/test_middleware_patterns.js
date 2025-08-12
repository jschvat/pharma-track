// Test if the checkDataIntegrity middleware is rejecting our data

const testData = {
  name: 'Test Admin 5',
  email: 'testadmin5@example.com',
  phone: '5551234576',
  password: 'TestPassword123!',
  address: '789 Admin Street, Test City, TC 12345',
  role: 'admin'
};

const suspiciousPatterns = [
  /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bUNION\b)/i,
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi
];

const checkValue = (value) => {
  if (typeof value === 'string') {
    return suspiciousPatterns.some(pattern => pattern.test(value));
  }
  return false;
};

const checkObject = (obj) => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkObject(obj[key])) return true;
      } else if (checkValue(obj[key])) {
        console.log(`❌ Suspicious pattern found in field "${key}": "${obj[key]}"`);
        // Test which pattern matches
        suspiciousPatterns.forEach((pattern, index) => {
          if (pattern.test(obj[key])) {
            console.log(`  - Pattern ${index} matched: ${pattern}`);
          }
        });
        return true;
      }
    }
  }
  return false;
};

console.log('Testing data for suspicious patterns:');
console.log('Data:', testData);
console.log('');

const isSuspicious = checkObject(testData);
console.log(`Result: ${isSuspicious ? '❌ SUSPICIOUS' : '✅ CLEAN'}`);

// Test each field individually
console.log('\nTesting each field:');
for (const [key, value] of Object.entries(testData)) {
  const fieldSuspicious = checkValue(value);
  console.log(`${key}: "${value}" - ${fieldSuspicious ? '❌ SUSPICIOUS' : '✅ CLEAN'}`);
  
  if (fieldSuspicious) {
    suspiciousPatterns.forEach((pattern, index) => {
      if (pattern.test(value)) {
        console.log(`    - Pattern ${index}: ${pattern}`);
      }
    });
  }
}