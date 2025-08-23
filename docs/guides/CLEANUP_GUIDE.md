# PharmaTraK Cleanup Guide

## 🧹 Code Cleanup & Organization

This guide identifies files that can be safely removed or reorganized to improve codebase maintainability.

## 📂 Files to Remove

### Frontend - Unused Components
```bash
# Remove test/debug components
rm frontend/src/components/DropdownTest.js
rm frontend/src/components/DropdownRouteHandler.js
rm frontend/src/components/Inventory.js.backup

# Remove unused utilities (dropdown functionality disabled)
# Note: Keep dropdownUtils.js as it may be re-enabled later
# rm frontend/src/utils/dropdownUtils.js
```

### Debug/Development Files
```bash
# Remove debug JSON files (keep structure for future debugging)
rm debug/debug_login.json
rm debug/login.json  
rm debug/login_response.json
rm debug/user.json

# Remove old debug utilities (consolidated into utilities/)
rm utils/debugLogger.js
```

### Documentation Cleanup
```bash
# Remove redundant documentation
rm INVENTORY_SNAPSHOT_SYSTEM.md    # Content moved to docs/
rm README_INVENTORY_SNAPSHOT.md    # Content moved to docs/
rm frontend/COLLAPSED_SIDEBAR_FIX.md    # Issue resolved
rm frontend/ICON_SYSTEM.md             # Content moved to docs/
```

### Frontend Package Scripts
```bash
# Remove backup package.json scripts
rm frontend/package.json.scripts
```

## 🗂️ Files to Organize

### Move to Archive
Create an `archive/` directory for historical files:
```bash
mkdir archive
mv frontend/DEBUG_LOGGING.md archive/
mv frontend/COLLAPSED_SIDEBAR_FIX.md archive/
mv frontend/ICON_SYSTEM.md archive/
```

### Consolidate Documentation
```bash
# Move all documentation to docs/
mv SETUP.md docs/
mv Makefile docs/build/
```

## 🧽 Code Cleanup Tasks

### Frontend Component Headers
Add consistent JSDoc headers to all components:

```javascript
/**
 * ComponentName - Brief description
 * 
 * Detailed description of what this component does,
 * its main features, and how it fits into the application.
 * 
 * @component
 * @example
 * return (
 *   <ComponentName prop1="value" prop2={value} />
 * )
 * 
 * @param {Object} props - Component props
 * @param {string} props.prop1 - Description of prop1
 * @param {number} props.prop2 - Description of prop2
 * 
 * @returns {JSX.Element} The rendered component
 * 
 * @author PharmaTraK Development Team
 * @since 1.0.0
 */
```

### Backend Route Documentation
Add comprehensive API documentation to route files:

```javascript
/**
 * @fileoverview User management API routes
 * Handles CRUD operations for user accounts, authentication,
 * and role-based access control.
 * 
 * @author PharmaTraK Development Team
 * @since 1.0.0
 */

/**
 * Get all users
 * @route GET /api/users
 * @description Retrieves a paginated list of all users
 * @access Admin only
 * @param {Object} req.query - Query parameters
 * @param {number} req.query.page - Page number (default: 1)
 * @param {number} req.query.limit - Items per page (default: 20)
 * @returns {Object} Paginated user list
 */
```

## 🔧 Automated Cleanup Script

### Create cleanup script
```bash
#!/bin/bash
# cleanup.sh - Automated codebase cleanup

echo "🧹 Starting PharmaTraK codebase cleanup..."

# Create archive directory
mkdir -p archive

# Remove unused files
echo "📁 Removing unused files..."
rm -f frontend/src/components/DropdownTest.js
rm -f frontend/src/components/DropdownRouteHandler.js  
rm -f frontend/src/components/Inventory.js.backup
rm -f frontend/package.json.scripts

# Archive old documentation
echo "📚 Archiving old documentation..."
mv frontend/DEBUG_LOGGING.md archive/ 2>/dev/null || true
mv frontend/COLLAPSED_SIDEBAR_FIX.md archive/ 2>/dev/null || true
mv frontend/ICON_SYSTEM.md archive/ 2>/dev/null || true

# Clean debug files
echo "🐛 Cleaning debug files..."
rm -f debug/debug_login.json
rm -f debug/login.json
rm -f debug/login_response.json
rm -f debug/user.json

# Remove duplicate utilities
echo "🔧 Removing duplicate utilities..."
rm -f utils/debugLogger.js

echo "✅ Cleanup complete!"
echo "📋 Next steps:"
echo "   1. Review remaining files in debug/ directory"
echo "   2. Add JSDoc headers to components missing them"
echo "   3. Update import statements if any broken imports"
echo "   4. Run tests to ensure nothing is broken"
```

## 📋 Code Quality Improvements

### 1. Consistent Import Ordering
Standardize import statements across all files:
```javascript
// React/React ecosystem
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Third-party libraries
import { Card, Button, Table } from 'react-bootstrap';
import axios from 'axios';

// Internal utilities and contexts
import { useAuth } from '../contexts/AuthContext';
import { useDebug } from '../contexts/DebugContext';

// Internal components
import FormField from '../common/FormField';
import DataTable from '../common/DataTable';

// Services and utilities
import api from '../services/api';
import { formatDate } from '../utils/dateUtils';

// Styles
import './ComponentName.css';
```

### 2. Remove Console.log Statements
Search and remove development console.log statements:
```bash
# Find all console.log statements
grep -r "console\.log" --exclude-dir=node_modules .

# Remove them (except in debug utilities)
```

### 3. Standardize Error Handling
Implement consistent error handling patterns:
```javascript
// Frontend error handling
try {
  const result = await api.post('/endpoint', data);
  // Handle success
} catch (error) {
  console.error('Operation failed:', error);
  // Handle error appropriately
}

// Backend error handling  
try {
  const result = await Model.operation(data);
  res.json({ success: true, data: result });
} catch (error) {
  console.error('Database operation failed:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Operation failed',
    message: error.message 
  });
}
```

## 📊 Code Metrics to Track

### File Size Optimization
- **Large files (>500 lines)**: Consider splitting into smaller modules
- **Duplicate code**: Extract into reusable functions/components
- **Dead code**: Remove unused functions and variables

### Import Optimization
- **Unused imports**: Remove to reduce bundle size
- **Circular imports**: Refactor to prevent dependency loops
- **Heavy imports**: Use dynamic imports for large libraries

### Performance Improvements
- **Large components**: Split into smaller, focused components
- **Heavy computations**: Memoize expensive operations
- **Unnecessary re-renders**: Use React.memo and useMemo

## 🧪 Post-Cleanup Testing

### Frontend Testing
```bash
cd frontend
npm test                    # Run all tests
npm run build              # Ensure build succeeds
npm start                  # Verify app starts correctly
```

### Backend Testing
```bash
node server.js             # Start server
node tests/test-api.js     # Run API tests
```

### Integration Testing
1. **Login Flow**: Verify authentication works
2. **Key Features**: Test inventory, user management, reports
3. **Admin Functions**: Ensure admin-only features work
4. **API Endpoints**: Test all critical API routes

## 📚 Documentation Updates

### Update Main README
- Remove references to deleted files
- Update file structure diagrams  
- Refresh getting started instructions

### Component Documentation
- Add missing JSDoc headers
- Update prop documentation
- Add usage examples

### API Documentation
- Document all endpoints
- Add request/response examples
- Include authentication requirements

---

**Last Updated**: August 2025  
**Maintainer**: PharmaTraK Development Team