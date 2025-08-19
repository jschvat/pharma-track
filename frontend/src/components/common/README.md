# PharmaTraK Custom Dropdown Components

This document describes the custom dropdown components created to solve positioning, clipping, and UX issues throughout the PharmaTraK application.

## Components Overview

### 1. MultiSelectDropdown
Advanced multi-select dropdown with checkboxes, perfect for filtering and complex selections.

### 2. PharmaDropdown  
Standard single-select dropdown with optional search functionality.

## Problems These Components Solve

### ❌ Original Issues:
- **Positioning jumps** - Dropdowns appear in wrong location initially, then jump to correct position
- **Clipping issues** - Dropdowns get cut off by container boundaries when space is limited
- **Poor UX** - Form.Select elements don't provide good visual feedback for multi-select
- **Inconsistent behavior** - Different dropdown implementations throughout the app
- **Z-index conflicts** - Dropdowns appear behind other UI elements

### ✅ Our Solutions:
- **Immediate correct positioning** using optimized Popper.js configuration
- **Fixed positioning strategy** that prevents clipping regardless of container constraints
- **Ultra-high z-index (9999)** ensures dropdowns appear above all other elements
- **Scroll-independent positioning** - dropdowns stay in place when tables scroll
- **Consistent multi-select UX** with checkboxes and smart display text
- **Viewport boundary detection** with automatic flip to prevent off-screen rendering
- **Forced position recalculation** on open to eliminate positioning delays
- **Smart auto-sizing** that adapts dropdown width and height to content while respecting screen constraints
- **Enhanced overflow handling** - no unnecessary scrollbars when content fits
- **Table scroll detection** - automatically closes dropdowns when parent tables are scrolled (configurable)

## Usage Examples

### MultiSelectDropdown

```jsx
import MultiSelectDropdown from "./common/MultiSelectDropdown";

// Basic usage
<MultiSelectDropdown
  options={[
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' }
  ]}
  selectedValues={['apple', 'cherry']}
  onSelectionChange={(newValues) => setSelected(newValues)}
  placeholder="Select fruits..."
  noneSelectedText="All fruits"
  header="Available Fruits"
/>

// Transaction register filtering (real example)
<MultiSelectDropdown
  options={getDropdownOptions("transaction_type")}
  selectedValues={columnFilters.transaction_type}
  onSelectionChange={handleMultiSelectChange("transaction_type")}
  placeholder="All Types"
  noneSelectedText="All Types"
  header="Transaction Types"
  variant="outline-secondary"
  size="sm"
  autoSize={true}
  maxMenuWidth="400px"
  closeOnTableScroll={true}
/>
```

### PharmaDropdown

```jsx
import PharmaDropdown from "./common/PharmaDropdown";

// Basic single-select
<PharmaDropdown
  options={[
    { value: 'urgent', label: 'Urgent' },
    { value: 'normal', label: 'Normal' },
    { value: 'low', label: 'Low Priority' }
  ]}
  selectedValue={priority}
  onSelectionChange={setPriority}
  placeholder="Select priority..."
/>

// With search functionality
<PharmaDropdown
  options={userOptions}
  selectedValue={assignedUser}
  onSelectionChange={setAssignedUser}
  placeholder="Select user..."
  searchable={true}
  clearable={true}
/>

// With auto-sizing (adapts width to content)
<PharmaDropdown
  options={longTextOptions}
  selectedValue={selectedValue}
  onSelectionChange={setSelectedValue}
  placeholder="Select option..."
  autoSize={true}
  maxMenuWidth="500px"
  closeOnTableScroll={true}
/>

// Disable auto-close on table scroll
<PharmaDropdown
  options={userOptions}
  selectedValue={assignedUser}
  onSelectionChange={setAssignedUser}
  placeholder="Select user..."
  closeOnTableScroll={false}
/>
```

## Migration Guide

### From Form.Select to PharmaDropdown

```jsx
// OLD - problematic Form.Select
<Form.Select 
  value={selectedValue}
  onChange={(e) => setValue(e.target.value)}
>
  <option value="">All options</option>
  {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
</Form.Select>

// NEW - robust PharmaDropdown  
<PharmaDropdown
  options={options.map(opt => ({ value: opt, label: opt }))}
  selectedValue={selectedValue}
  onSelectionChange={setValue}
  placeholder="All options"
/>
```

### From Complex Bootstrap Dropdown to MultiSelectDropdown

```jsx
// OLD - complex manual implementation (60+ lines)
<Dropdown drop="down" autoClose={false}>
  <Dropdown.Toggle>{/* complex logic */}</Dropdown.Toggle>
  <Dropdown.Menu>{/* complex positioning logic */}</Dropdown.Menu>
</Dropdown>

// NEW - simple component usage (8 lines)
<MultiSelectDropdown
  options={dropdownOptions}
  selectedValues={selectedValues}
  onSelectionChange={setSelectedValues}
  placeholder="All options"
  header="Filter Options"
/>
```

## Where They're Used

Currently implemented in:
- ✅ **Transaction Register** - Multi-select filtering by transaction type and user

Ready for use throughout the application!