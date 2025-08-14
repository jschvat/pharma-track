const { validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value.trim();
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

/**
 * Validate drug data for creation/update
 */
const validateDrugData = (req, res, next) => {
  const { drug } = req.body;
  
  if (!drug) {
    return res.status(400).json({
      error: 'Drug data is required'
    });
  }
  
  // Required fields
  const requiredFields = ['ndc', 'generic_name'];
  const missingFields = requiredFields.filter(field => !drug[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Missing required drug fields: ${missingFields.join(', ')}`
    });
  }
  
  // NDC format validation (basic)
  if (!/^\d{4,5}-\d{3,4}-\d{1,2}$/.test(drug.ndc)) {
    return res.status(400).json({
      error: 'Invalid NDC format. Expected format: XXXXX-XXXX-XX'
    });
  }
  
  next();
};

/**
 * Validate inventory data for creation/update
 */
const validateInventoryData = (req, res, next) => {
  const { inventory } = req.body;
  
  if (!inventory) {
    return res.status(400).json({
      error: 'Inventory data is required'
    });
  }
  
  // Required fields
  if (!inventory.store_id) {
    return res.status(400).json({
      error: 'Store ID is required for inventory'
    });
  }
  
  // Validate numeric fields
  const numericFields = ['quantity_on_hand', 'reorder_level', 'unit_cost', 'selling_price'];
  for (const field of numericFields) {
    if (inventory[field] !== undefined && (typeof inventory[field] !== 'number' || inventory[field] < 0)) {
      return res.status(400).json({
        error: `${field} must be a non-negative number`
      });
    }
  }
  
  next();
};

module.exports = {
  handleValidationErrors,
  sanitizeInput,
  validateDrugData,
  validateInventoryData
};