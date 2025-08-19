#!/usr/bin/env node

/**
 * Claude Error Repair Logger
 * 
 * Quick helper script for Claude to log successful error repairs
 * with predefined templates for common fix types.
 * 
 * Usage:
 *   node scripts/claude-log-repair.js react-state "Inventory items not showing"
 *   node scripts/claude-log-repair.js dropdown-positioning "Dropdown clipping issues"  
 *   node scripts/claude-log-repair.js custom "Custom fix description"
 * 
 * @author PharmaTraK Development Team
 */

const { addRepairEntry } = require('./log-error-repair');

const REPAIR_TEMPLATES = {
  'react-state': {
    title: 'React State Update Issue',
    description: 'Component state not updating properly, causing UI to not reflect data changes.',
    tags: ['React State', 'Frontend', 'Component Lifecycle'],
    severity: 'high',
    rootCause: [
      'React not detecting state changes due to same object reference',
      'Improper use of useState setter function',
      'Missing dependencies in useCallback/useEffect'
    ]
  },
  
  'dropdown-positioning': {
    title: 'Bootstrap Dropdown Positioning Problems',
    description: 'Dropdown menus appearing in wrong location, getting clipped, or jumping after initial render.',
    tags: ['Bootstrap', 'Popper.js', 'CSS Positioning', 'UX'],
    severity: 'medium',
    rootCause: [
      'Popper.js positioning strategy conflicts with container overflow',
      'Z-index issues causing dropdowns to appear behind other elements',
      'Container boundaries clipping dropdown menus'
    ]
  },
  
  'api-integration': {
    title: 'API Integration Issue',
    description: 'Problems with backend API calls, data fetching, or response handling.',
    tags: ['API', 'Backend Integration', 'Data Fetching'],
    severity: 'high',
    rootCause: [
      'Incorrect API endpoint URL or parameters',
      'Authentication/authorization issues',
      'Response data structure mismatch'
    ]
  },
  
  'database-query': {
    title: 'Database Query Problem',
    description: 'SQL query issues, performance problems, or data retrieval errors.',
    tags: ['Database', 'SQL', 'Performance', 'Backend'],
    severity: 'high',
    rootCause: [
      'Inefficient query structure or missing indexes',
      'SQL syntax errors or parameter binding issues',
      'Transaction management problems'
    ]
  },
  
  'css-layout': {
    title: 'CSS Layout/Styling Issue',
    description: 'Visual layout problems, responsive design issues, or styling conflicts.',
    tags: ['CSS', 'Layout', 'Responsive Design', 'Frontend'],
    severity: 'low',
    rootCause: [
      'CSS specificity conflicts or inheritance issues',
      'Flexbox/Grid layout configuration problems',
      'Responsive breakpoint handling'
    ]
  },
  
  'form-validation': {
    title: 'Form Validation Problem',
    description: 'Issues with form input validation, error handling, or user feedback.',
    tags: ['Forms', 'Validation', 'UX', 'Frontend'],
    severity: 'medium',
    rootCause: [
      'Validation logic not properly triggered',
      'Error state management issues',
      'User feedback not displaying correctly'
    ]
  },
  
  'performance': {
    title: 'Performance Optimization',
    description: 'Application performance issues, slow loading, or inefficient rendering.',
    tags: ['Performance', 'Optimization', 'React', 'Database'],
    severity: 'medium',
    rootCause: [
      'Unnecessary re-renders or expensive computations',
      'Inefficient database queries or API calls',
      'Large bundle sizes or unoptimized assets'
    ]
  }
};

/**
 * Quick log function for specific fix types
 */
function quickLog(fixType, customTitle, additionalData = {}) {
  const template = REPAIR_TEMPLATES[fixType];
  
  if (!template) {
    console.error(`❌ Unknown fix type: ${fixType}`);
    console.log('Available types:', Object.keys(REPAIR_TEMPLATES).join(', '));
    process.exit(1);
  }
  
  const repairData = {
    ...template,
    title: customTitle || template.title,
    files: additionalData.files || ['frontend/src/components/'],
    timeToFix: additionalData.timeToFix || '~30 minutes',
    testResults: additionalData.testResults,
    impact: additionalData.impact,
    codeBlocks: additionalData.codeBlocks || [],
    ...additionalData
  };
  
  console.log(`📝 Logging ${fixType} repair: ${repairData.title}`);
  addRepairEntry(repairData);
}

/**
 * Add the two major fixes we just completed
 */
function logRecentFixes() {
  console.log('📝 Logging recent major fixes...\n');
  
  // 1. Inventory State Fix
  quickLog('react-state', 'Inventory Items Not Displaying in Table', {
    files: ['frontend/src/components/Inventory.js'],
    severity: 'critical',
    timeToFix: '~45 minutes',
    description: 'The inventory management page showed "No inventory items found" instead of displaying the actual drugs from the database. The API was returning data correctly (10 inventory items), but the React component state wasn\'t updating, causing the table to remain empty.',
    rootCause: [
      '<strong>API Response:</strong> ✅ Working correctly - returning 10 inventory items',
      '<strong>Data Structure:</strong> ✅ Correct - <code>response.data.data.inventory</code> was populated',
      '<strong>React State Update:</strong> ❌ FAILING - <code>setInventory(newInventory)</code> not triggering re-render',
      '<strong>useCallback Dependencies:</strong> ❌ Causing infinite loops'
    ],
    codeBlocks: [
      {
        title: '1. State Update Pattern Fix',
        beforeLabel: 'Broken',
        before: `if (Array.isArray(newInventory)) {
  setInventory(newInventory);
  console.log('✅ Inventory state updated');
} else {
  setInventory([]);
}`,
        afterLabel: 'Working',
        after: `if (Array.isArray(newInventory) && newInventory.length > 0) {
  // Force state update using functional form
  setInventory(prevInventory => {
    console.log("🔄 State update: from", prevInventory.length, "to", newInventory.length, "items");
    return [...newInventory]; // Create new array to trigger re-render
  });
  
  // Force re-render to ensure UI updates
  setForceUpdate(prev => prev + 1);
  console.log('✅ INVENTORY STATE UPDATED');
}`
      },
      {
        title: '2. useCallback Dependencies Fix',
        beforeLabel: 'Infinite Loops',
        before: `}, [user.store_id, filters]);`,
        afterLabel: 'Specific Dependencies',
        after: `}, [user?.store_id, filters.search, filters.active, filters.low_stock, filters.expiring]);`
      }
    ],
    testResults: `
    <ul>
        <li><strong>Inventory Display:</strong> Now shows 10 real drugs (Acetaminophen, Amlodipine, etc.)</li>
        <li><strong>State Updates:</strong> Console shows successful state transitions</li>
        <li><strong>Performance:</strong> No infinite re-render loops</li>
        <li><strong>User Experience:</strong> Table loads correctly every time</li>
    </ul>`,
    tags: ['React State', 'useCallback', 'Frontend', 'Critical Fix', 'Inventory Management']
  });
  
  // 2. Dropdown Positioning Fix
  quickLog('dropdown-positioning', 'Dropdown Positioning Jumps and Clipping Issues', {
    files: ['frontend/src/components/Inventory.js', 'frontend/src/components/common/MultiSelectDropdown.js', 'frontend/src/components/common/PharmaDropdown.js'],
    severity: 'high',
    timeToFix: '~90 minutes',
    description: 'Transaction register filter dropdowns had multiple issues: positioning jumps (appearing in wrong location initially), clipping issues (getting cut off when transaction register had few entries), and poor UX (Form.Select didn\'t provide good multi-select experience).',
    rootCause: [
      '<strong>Positioning jumps:</strong> Bootstrap dropdowns rendered before Popper.js calculated correct position',
      '<strong>Clipping issues:</strong> Container overflow settings prevented dropdowns from extending outside bounds',
      '<strong>Poor UX:</strong> Form.Select elements don\'t provide visual feedback for multi-select scenarios'
    ],
    codeBlocks: [
      {
        title: '1. Simplified Component Usage',
        beforeLabel: '60+ lines each dropdown',
        before: `<Dropdown drop="down" autoClose={false}>
  <Dropdown.Toggle variant="outline-secondary">
    {/* Complex display logic */}
  </Dropdown.Toggle>
  <Dropdown.Menu style={{...}} popperConfig={{...}}>
    {/* Complex checkbox and selection logic */}
    {/* 50+ more lines... */}
  </Dropdown.Menu>
</Dropdown>`,
        afterLabel: '8 lines per dropdown',
        after: `<MultiSelectDropdown
  options={getDropdownOptions("transaction_type")}
  selectedValues={columnFilters.transaction_type}
  onSelectionChange={handleMultiSelectChange("transaction_type")}
  placeholder="All Types"
  header="Transaction Types"
  variant="outline-secondary"
  size="sm"
/>`
      },
      {
        title: '2. Advanced Positioning Configuration',
        beforeLabel: 'Clipping Issues',
        before: `popperConfig={{
  strategy: 'absolute', // Gets clipped by containers
  modifiers: [...] // Basic configuration
}}`,
        afterLabel: 'No Clipping',
        after: `popperConfig={{
  strategy: 'fixed', // Prevents clipping
  placement: 'bottom-start',
  modifiers: [
    {
      name: 'preventOverflow',
      options: {
        boundary: 'viewport',
        rootBoundary: 'viewport'
      }
    },
    {
      name: 'flip',
      options: {
        fallbackPlacements: ['top-start', 'bottom-start']
      }
    }
  ]
}}

// Ultra-high z-index and forced positioning
style={{ 
  zIndex: 9999,
  position: 'fixed'
}}`
      }
    ],
    impact: `
    <ul>
        <li><strong>Code Reduction:</strong> 60+ lines → 8 lines per dropdown (87% reduction)</li>
        <li><strong>Reusability:</strong> Created 2 reusable components for entire application</li>
        <li><strong>UX Enhancement:</strong> Proper multi-select with checkboxes and smart display text</li>
        <li><strong>Technical Solution:</strong> No more positioning jumps or clipping issues</li>
        <li><strong>Maintainability:</strong> Centralized dropdown logic with comprehensive documentation</li>
    </ul>`,
    tags: ['Bootstrap', 'Popper.js', 'Component Library', 'UX Improvement', 'Code Reduction', 'Reusable Components']
  });
  
  console.log('\n✅ Successfully logged both major fixes to the repair log!');
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: 
  node scripts/claude-log-repair.js <fix-type> [custom-title]
  node scripts/claude-log-repair.js log-recent

Available fix types:
  ${Object.keys(REPAIR_TEMPLATES).join('\n  ')}
  
Special commands:
  log-recent    Log the major fixes we just completed
  
Examples:
  node scripts/claude-log-repair.js react-state "Inventory not displaying"
  node scripts/claude-log-repair.js dropdown-positioning
  node scripts/claude-log-repair.js log-recent
`);
    process.exit(1);
  }
  
  const [command, customTitle] = args;
  
  if (command === 'log-recent') {
    logRecentFixes();
  } else if (REPAIR_TEMPLATES[command]) {
    quickLog(command, customTitle);
  } else {
    console.error(`❌ Unknown command or fix type: ${command}`);
    process.exit(1);
  }
}

module.exports = { quickLog, REPAIR_TEMPLATES };