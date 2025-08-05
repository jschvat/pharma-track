class ValidationError extends Error {
  constructor(message, field = null, code = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
  }
}

class DatabaseConstraintError extends Error {
  constructor(message, constraint = null, field = null) {
    super(message);
    this.name = 'DatabaseConstraintError';
    this.constraint = constraint;
    this.field = field;
  }
}

const handleDatabaseError = (error) => {
  if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    const constraintMatch = error.message.match(/Check constraint '(\w+)' is violated/);
    const constraint = constraintMatch ? constraintMatch[1] : 'unknown';
    
    const fieldMap = {
      'chk_stores_name': 'store name',
      'chk_stores_address': 'store address',
      'chk_stores_state': 'state',
      'chk_stores_zipcode': 'zipcode',
      'chk_stores_phone': 'store phone',
      'chk_stores_fax': 'fax',
      'chk_stores_dea': 'DEA registration number',
      'chk_stores_npi': 'NPI number',
      'chk_users_name': 'user name',
      'chk_users_email': 'email',
      'chk_users_phone': 'user phone',
      'chk_users_password': 'password',
      'chk_users_address': 'user address'
    };

    const field = fieldMap[constraint] || 'field';
    const message = `Invalid ${field} format. Please check the data and try again.`;
    
    throw new DatabaseConstraintError(message, constraint, field);
  }

  if (error.code === 'ER_DUP_ENTRY') {
    const duplicateMatch = error.message.match(/Duplicate entry '(.+)' for key '(.+)'/);
    if (duplicateMatch) {
      const value = duplicateMatch[1];
      const key = duplicateMatch[2];
      
      if (key.includes('email')) {
        throw new ValidationError(`Email address '${value}' is already registered`, 'email', 'DUPLICATE_EMAIL');
      } else if (key.includes('dea')) {
        throw new ValidationError(`DEA registration number '${value}' is already in use`, 'dea_registration_number', 'DUPLICATE_DEA');
      } else if (key.includes('npi')) {
        throw new ValidationError(`NPI number '${value}' is already in use`, 'npi', 'DUPLICATE_NPI');
      }
    }
    throw new ValidationError('This record already exists', null, 'DUPLICATE_ENTRY');
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    throw new ValidationError('Referenced record does not exist', null, 'INVALID_REFERENCE');
  }

  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    throw new ValidationError('Cannot delete record because it is referenced by other records', null, 'REFERENCED_RECORD');
  }

  if (error.code === 'ER_DATA_TOO_LONG') {
    const fieldMatch = error.message.match(/Data too long for column '(\w+)'/);
    const field = fieldMatch ? fieldMatch[1] : 'field';
    throw new ValidationError(`Data too long for ${field}`, field, 'DATA_TOO_LONG');
  }

  if (error.code === 'ER_TRUNCATED_WRONG_VALUE') {
    throw new ValidationError('Invalid data format provided', null, 'INVALID_FORMAT');
  }

  // Re-throw other errors as-is
  throw error;
};

module.exports = {
  ValidationError,
  DatabaseConstraintError,
  handleDatabaseError
};