/**
 * PharmaTypes - Type Guards and Validation Functions for JavaScript
 * 
 * Runtime type validation utilities for pharmacy applications.
 * Provides type guards and validation functions that work in JavaScript
 * while maintaining compatibility with TypeScript type definitions.
 * 
 * Features:
 * - Runtime type validation for pharmacy data models
 * - NDC, DEA, and medical format validations
 * - Entity type guards for safe data handling
 * - Validation utilities for forms and API responses
 * 
 * @module PharmaTypes
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

// =============================================================================
// Type Guards for Pharmacy Entities
// =============================================================================

/**
 * Validates if an object is a valid User entity
 * @param {any} obj - Object to validate
 * @returns {boolean} True if object is a valid User
 */
export const isUser = (obj) => {
  return typeof obj === 'object' && obj !== null && 
         typeof obj.id !== 'undefined' && 
         typeof obj.email === 'string' &&
         typeof obj.role === 'string' &&
         ['admin', 'user', 'pharmacist', 'technician', 'god_mode'].includes(obj.role);
};

/**
 * Validates if an object is a valid Drug entity
 * @param {any} obj - Object to validate
 * @returns {boolean} True if object is a valid Drug
 */
export const isDrug = (obj) => {
  return typeof obj === 'object' && obj !== null &&
         typeof obj.id !== 'undefined' &&
         typeof obj.ndc === 'string' &&
         typeof obj.generic_name === 'string' &&
         typeof obj.is_active === 'boolean';
};

/**
 * Validates if an object is a valid InventoryItem entity
 * @param {any} obj - Object to validate
 * @returns {boolean} True if object is a valid InventoryItem
 */
export const isInventoryItem = (obj) => {
  return typeof obj === 'object' && obj !== null &&
         typeof obj.id !== 'undefined' &&
         typeof obj.store_id !== 'undefined' &&
         typeof obj.drug_id !== 'undefined' &&
         typeof obj.quantity_on_hand === 'number' &&
         obj.quantity_on_hand >= 0;
};

/**
 * Validates if an object is a valid Prescription entity
 * @param {any} obj - Object to validate
 * @returns {boolean} True if object is a valid Prescription
 */
export const isPrescription = (obj) => {
  return typeof obj === 'object' && obj !== null &&
         typeof obj.id !== 'undefined' &&
         typeof obj.rx_number === 'string' &&
         typeof obj.patient_id !== 'undefined' &&
         typeof obj.drug_id !== 'undefined' &&
         typeof obj.quantity === 'number' &&
         obj.quantity > 0;
};

/**
 * Validates if an object is a valid Patient entity
 * @param {any} obj - Object to validate
 * @returns {boolean} True if object is a valid Patient
 */
export const isPatient = (obj) => {
  return typeof obj === 'object' && obj !== null &&
         typeof obj.id !== 'undefined' &&
         typeof obj.first_name === 'string' &&
         typeof obj.last_name === 'string' &&
         typeof obj.date_of_birth === 'string' &&
         /^\d{4}-\d{2}-\d{2}$/.test(obj.date_of_birth);
};

/**
 * Validates if an object is a valid Store entity
 * @param {any} obj - Object to validate
 * @returns {boolean} True if object is a valid Store
 */
export const isStore = (obj) => {
  return typeof obj === 'object' && obj !== null &&
         typeof obj.id !== 'undefined' &&
         typeof obj.name === 'string' &&
         typeof obj.address === 'string' &&
         typeof obj.city === 'string' &&
         typeof obj.state === 'string' &&
         typeof obj.zipcode === 'string';
};

/**
 * Validates if an object is a valid Prescriber entity
 * @param {any} obj - Object to validate
 * @returns {boolean} True if object is a valid Prescriber
 */
export const isPrescriber = (obj) => {
  return typeof obj === 'object' && obj !== null &&
         typeof obj.id !== 'undefined' &&
         typeof obj.first_name === 'string' &&
         typeof obj.last_name === 'string' &&
         typeof obj.dea_number === 'string' &&
         typeof obj.npi === 'string';
};

// =============================================================================
// Format Validation Functions
// =============================================================================

/**
 * Validates National Drug Code (NDC) format
 * @param {string} ndc - NDC string to validate
 * @returns {boolean} True if NDC is valid format
 */
export const isValidNDC = (ndc) => {
  if (typeof ndc !== 'string') return false;
  
  const cleaned = ndc.replace(/[^0-9]/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
};

/**
 * Validates DEA registration number format
 * @param {string} dea - DEA number to validate
 * @returns {boolean} True if DEA number is valid format
 */
export const isValidDEA = (dea) => {
  if (typeof dea !== 'string') return false;
  
  // DEA format: 2 letters + 7 digits
  if (!/^[A-Z]{2}[0-9]{7}$/.test(dea)) return false;
  
  // Validate check digit
  const checkDigit = parseInt(dea[8]);
  const sum = (parseInt(dea[2]) + parseInt(dea[4]) + parseInt(dea[6])) + 
              2 * (parseInt(dea[3]) + parseInt(dea[5]) + parseInt(dea[7]));
  const calculatedCheckDigit = sum % 10;
  
  return checkDigit === calculatedCheckDigit;
};

/**
 * Validates email address format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid format
 */
export const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

/**
 * Validates US phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if phone number is valid format
 */
export const isValidPhone = (phone) => {
  if (typeof phone !== 'string') return false;
  
  const cleaned = phone.replace(/[^0-9]/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
};

/**
 * Validates US zipcode format
 * @param {string} zipcode - Zipcode to validate
 * @returns {boolean} True if zipcode is valid format
 */
export const isValidZipcode = (zipcode) => {
  if (typeof zipcode !== 'string') return false;
  
  return /^[0-9]{5}(-[0-9]{4})?$/.test(zipcode);
};

/**
 * Validates NPI (National Provider Identifier) format
 * @param {string} npi - NPI to validate
 * @returns {boolean} True if NPI is valid format
 */
export const isValidNPI = (npi) => {
  if (typeof npi !== 'string') return false;
  
  if (!/^[0-9]{10}$/.test(npi)) return false;
  
  // Validate check digit using Luhn algorithm
  const digits = npi.split('').map(Number);
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
  return checkDigit === digits[9];
};

/**
 * Validates date string in YYYY-MM-DD format
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if date string is valid format
 */
export const isValidDateString = (dateString) => {
  if (typeof dateString !== 'string') return false;
  
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && date.toISOString().split('T')[0] === dateString;
};

/**
 * Validates timestamp string in ISO 8601 format
 * @param {string} timestamp - Timestamp string to validate
 * @returns {boolean} True if timestamp is valid format
 */
export const isValidTimestamp = (timestamp) => {
  if (typeof timestamp !== 'string') return false;
  
  const date = new Date(timestamp);
  return date instanceof Date && !isNaN(date);
};

// =============================================================================
// Medical Data Validation Functions
// =============================================================================

/**
 * Validates prescription status
 * @param {string} status - Prescription status to validate
 * @returns {boolean} True if status is valid
 */
export const isValidPrescriptionStatus = (status) => {
  const validStatuses = [
    'pending', 'in_progress', 'ready', 'dispensed', 'partial',
    'cancelled', 'returned', 'on_hold', 'expired'
  ];
  return validStatuses.includes(status);
};

/**
 * Validates user role
 * @param {string} role - User role to validate
 * @returns {boolean} True if role is valid
 */
export const isValidUserRole = (role) => {
  const validRoles = ['admin', 'user', 'pharmacist', 'technician', 'god_mode'];
  return validRoles.includes(role);
};

/**
 * Validates transaction type
 * @param {string} transactionType - Transaction type to validate
 * @returns {boolean} True if transaction type is valid
 */
export const isValidTransactionType = (transactionType) => {
  const validTypes = [
    'prescription_fill', 'return_to_stock', 'expire', 'audit',
    'shipment_received', 'initial_inventory', 'transfer_out', 'transfer_in',
    'damaged', 'recalled', 'donation'
  ];
  return validTypes.includes(transactionType);
};

/**
 * Validates dosage form
 * @param {string} dosageForm - Dosage form to validate
 * @returns {boolean} True if dosage form is valid
 */
export const isValidDosageForm = (dosageForm) => {
  const validForms = [
    'TABLET', 'CAPSULE', 'LIQUID', 'INJECTION', 'CREAM', 'OINTMENT',
    'PATCH', 'INHALER', 'DROPS', 'SPRAY', 'SUPPOSITORY', 'POWDER'
  ];
  return validForms.includes(dosageForm);
};

/**
 * Validates route of administration
 * @param {string} route - Route to validate
 * @returns {boolean} True if route is valid
 */
export const isValidRoute = (route) => {
  const validRoutes = [
    'ORAL', 'TOPICAL', 'INJECTION', 'INHALATION', 'SUBLINGUAL',
    'RECTAL', 'OPHTHALMIC', 'OTIC', 'NASAL', 'TRANSDERMAL'
  ];
  return validRoutes.includes(route);
};

/**
 * Validates DEA schedule
 * @param {string} schedule - DEA schedule to validate
 * @returns {boolean} True if schedule is valid
 */
export const isValidDEASchedule = (schedule) => {
  const validSchedules = ['CI', 'CII', 'CIII', 'CIV', 'CV'];
  return validSchedules.includes(schedule);
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Safely extracts numeric value from string or number
 * @param {any} value - Value to convert to number
 * @returns {number|null} Number value or null if invalid
 */
export const safeNumber = (value) => {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  return null;
};

/**
 * Safely extracts integer value from string or number
 * @param {any} value - Value to convert to integer
 * @returns {number|null} Integer value or null if invalid
 */
export const safeInteger = (value) => {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string') {
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  }
  return null;
};

/**
 * Formats NDC with standard dashes
 * @param {string} ndc - NDC to format
 * @returns {string} Formatted NDC or original if invalid
 */
export const formatNDC = (ndc) => {
  if (!isValidNDC(ndc)) return ndc;
  
  const cleaned = ndc.replace(/[^0-9]/g, '');
  
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
  } else if (cleaned.length === 11) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9)}`;
  }
  
  return ndc;
};

/**
 * Formats phone number with standard format
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number or original if invalid
 */
export const formatPhone = (phone) => {
  if (!isValidPhone(phone)) return phone;
  
  const cleaned = phone.replace(/[^0-9]/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
};

/**
 * Validates and sanitizes user input
 * @param {any} value - Value to sanitize
 * @param {string} type - Expected type ('string', 'number', 'email', etc.)
 * @returns {any} Sanitized value or null if invalid
 */
export const sanitizeInput = (value, type) => {
  switch (type) {
    case 'string':
      return typeof value === 'string' ? value.trim() : null;
    case 'number':
      return safeNumber(value);
    case 'integer':
      return safeInteger(value);
    case 'email':
      const email = typeof value === 'string' ? value.trim().toLowerCase() : null;
      return email && isValidEmail(email) ? email : null;
    case 'phone':
      return typeof value === 'string' && isValidPhone(value) ? formatPhone(value) : null;
    case 'ndc':
      return typeof value === 'string' && isValidNDC(value) ? formatNDC(value) : null;
    case 'dea':
      return typeof value === 'string' && isValidDEA(value) ? value.toUpperCase() : null;
    case 'date':
      return typeof value === 'string' && isValidDateString(value) ? value : null;
    case 'boolean':
      return typeof value === 'boolean' ? value : null;
    default:
      return value;
  }
};

// Export all functions
export default {
  // Type guards
  isUser,
  isDrug,
  isInventoryItem,
  isPrescription,
  isPatient,
  isStore,
  isPrescriber,
  
  // Format validations
  isValidNDC,
  isValidDEA,
  isValidEmail,
  isValidPhone,
  isValidZipcode,
  isValidNPI,
  isValidDateString,
  isValidTimestamp,
  
  // Medical validations
  isValidPrescriptionStatus,
  isValidUserRole,
  isValidTransactionType,
  isValidDosageForm,
  isValidRoute,
  isValidDEASchedule,
  
  // Utilities
  safeNumber,
  safeInteger,
  formatNDC,
  formatPhone,
  sanitizeInput
};