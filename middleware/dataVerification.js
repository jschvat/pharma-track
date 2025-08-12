const { body, param } = require('express-validator');

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'PR', 'VI', 'GU', 'AS', 'MP'
];

const verifyEmail = () => {
  return body('email')
    .isEmail()
    .withMessage('Valid email address required')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage('Email format is invalid')
    .custom((value) => {
      const domain = value.split('@')[1];
      if (domain && domain.includes('..')) {
        throw new Error('Invalid email domain format');
      }
      return true;
    });
};

const verifyPhoneNumber = (fieldName = 'phone') => {
  return body(fieldName)
    .matches(/^[\+]?[1]?[\s\-\(\)]?[0-9]{3}[\s\-\(\)]?[0-9]{3}[\s\-]?[0-9]{4}$/)
    .withMessage('Phone number must be a valid US format (e.g., 555-123-4567)')
    .customSanitizer((value) => {
      return value.replace(/[^\d]/g, '');
    })
    .isLength({ min: 10, max: 11 })
    .withMessage('Phone number must be 10-11 digits');
};

const verifyFaxNumber = () => {
  return body('fax')
    .optional()
    .matches(/^[\+]?[1]?[\s\-\(\)]?[0-9]{3}[\s\-\(\)]?[0-9]{3}[\s\-]?[0-9]{4}$/)
    .withMessage('Fax number must be a valid US format (e.g., 555-123-4567)')
    .customSanitizer((value) => {
      return value ? value.replace(/[^\d]/g, '') : value;
    });
};

const verifyDeaNumber = () => {
  return body('dea_registration_number')
    .matches(/^[A-Z]{2}[0-9]{7}$/)
    .withMessage('DEA number must be in format: 2 letters followed by 7 digits (e.g., AB1234567)')
    .custom((value) => {
      const checkDigit = parseInt(value[8]);
      const sum = (parseInt(value[2]) + parseInt(value[4]) + parseInt(value[6])) + 
                  2 * (parseInt(value[3]) + parseInt(value[5]) + parseInt(value[7]));
      const calculatedCheckDigit = sum % 10;
      
      if (checkDigit !== calculatedCheckDigit) {
        throw new Error('DEA number check digit is invalid');
      }
      return true;
    });
};

const verifyNpiNumber = () => {
  return body('npi')
    .matches(/^[0-9]{10}$/)
    .withMessage('NPI must be exactly 10 digits')
    .custom((value) => {
      const digits = value.split('').map(Number);
      let sum = 0;
      
      for (let i = 0; i < 9; i++) {
        if (i % 2 === 0) {
          sum += digits[i];
        } else {
          let doubled = digits[i] * 2;
          sum += doubled > 9 ? doubled - 9 : doubled;
        }
      }
      
      const checkDigit = (10 - (sum % 10)) % 10;
      
      if (checkDigit !== digits[9]) {
        throw new Error('NPI check digit is invalid');
      }
      return true;
    });
};

const verifyZipcode = () => {
  return body('zipcode')
    .matches(/^[0-9]{5}(-[0-9]{4})?$/)
    .withMessage('Zipcode must be 5 digits or 5+4 format (e.g., 12345 or 12345-6789)')
    .customSanitizer((value) => {
      return value.replace(/[^\d-]/g, '');
    });
};

const verifyState = () => {
  return body('state')
    .isLength({ min: 2, max: 2 })
    .withMessage('State must be 2-letter abbreviation')
    .isAlpha()
    .withMessage('State must contain only letters')
    .toUpperCase()
    .isIn(US_STATES)
    .withMessage('Invalid US state abbreviation');
};

const verifyName = (fieldName = 'name') => {
  return body(fieldName)
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage(`${fieldName} must be between 2 and 100 characters`)
    .matches(/^[a-zA-Z0-9\s\-'\.]+$/)
    .withMessage(`${fieldName} can only contain letters, numbers, spaces, hyphens, apostrophes, and periods`)
    .custom((value) => {
      if (value.includes('  ')) {
        throw new Error(`${fieldName} cannot contain multiple consecutive spaces`);
      }
      return true;
    });
};

const verifyAddress = () => {
  return body('address')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters')
    .matches(/^[a-zA-Z0-9\s\-'\.#,]+$/)
    .withMessage('Address contains invalid characters');
};

const verifyPassword = () => {
  return body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)')
    .custom((value) => {
      const commonPasswords = [
        'password', '123456', '12345678', 'qwerty', 'abc123',
        'password123', 'admin', 'letmein', 'welcome', 'monkey'
      ];
      
      if (commonPasswords.includes(value.toLowerCase())) {
        throw new Error('Password is too common. Please choose a stronger password.');
      }
      return true;
    });
};

const verifyRole = () => {
  return body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('Role must be either "admin" or "user"');
};

const verifyBoolean = (fieldName) => {
  return body(fieldName)
    .optional()
    .isBoolean()
    .withMessage(`${fieldName} must be true or false`)
    .toBoolean();
};

const verifyNDC = () => {
  return body('ndc')
    .matches(/^[0-9\-]{7,14}$/)
    .withMessage('NDC must be 7-11 digits with optional dashes (e.g., 12345-678-90)')
    .customSanitizer((value) => {
      return value.replace(/[^\d]/g, '');
    })
    .custom((value) => {
      if (value.length < 7 || value.length > 11) {
        throw new Error('NDC must be 7-11 digits');
      }
      return true;
    });
};

const verifyQuantity = (fieldName = 'quantity') => {
  return body(fieldName)
    .isInt({ min: 0 })
    .withMessage(`${fieldName} must be a non-negative integer`)
    .toInt();
};

const verifyPrice = (fieldName) => {
  return body(fieldName)
    .optional()
    .isFloat({ min: 0 })
    .withMessage(`${fieldName} must be a positive number`)
    .custom((value) => {
      if (value && parseFloat(value) > 999999.99) {
        throw new Error(`${fieldName} cannot exceed $999,999.99`);
      }
      return true;
    });
};

const verifyDate = (fieldName) => {
  return body(fieldName)
    .optional()
    .isISO8601()
    .withMessage(`${fieldName} must be a valid date (YYYY-MM-DD)`)
    .toDate();
};

const verifyId = (paramName = 'id') => {
  return param(paramName)
    .isInt({ min: 1 })
    .withMessage(`${paramName} must be a positive integer`)
    .toInt();
};

const sanitizeAndTrim = () => {
  return (req, res, next) => {
    // Skip sanitization for GET requests as they shouldn't have bodies
    if (req.method === 'GET') {
      return next();
    }
    
    const sanitizeValue = (value) => {
      if (typeof value === 'string') {
        return value.trim()
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
      return value;
    };

    const sanitizeObject = (obj) => {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            sanitized[key] = sanitizeObject(obj[key]);
          } else if (Array.isArray(obj[key])) {
            sanitized[key] = obj[key].map(item => 
              typeof item === 'object' ? sanitizeObject(item) : sanitizeValue(item)
            );
          } else {
            sanitized[key] = sanitizeValue(obj[key]);
          }
        }
      }
      return sanitized;
    };

    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    next();
  };
};

const checkDataIntegrity = () => {
  return (req, res, next) => {
    // Skip data integrity checks for GET requests as they shouldn't have bodies
    if (req.method === 'GET') {
      return next();
    }
    
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
            return true;
          }
        }
      }
      return false;
    };

    if (req.body && checkObject(req.body)) {
      return res.status(400).json({
        error: 'Invalid data detected',
        message: 'Request contains potentially malicious content'
      });
    }

    next();
  };
};

module.exports = {
  verifyEmail,
  verifyPhoneNumber,
  verifyFaxNumber,
  verifyDeaNumber,
  verifyNpiNumber,
  verifyZipcode,
  verifyState,
  verifyName,
  verifyAddress,
  verifyPassword,
  verifyRole,
  verifyBoolean,
  verifyNDC,
  verifyQuantity,
  verifyPrice,
  verifyDate,
  verifyId,
  sanitizeAndTrim,
  checkDataIntegrity
};